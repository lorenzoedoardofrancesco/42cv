import type { NextApiRequest, NextApiResponse } from "next";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../../../db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const OG_CACHE_MS = 6 * 60 * 60 * 1000;
const SCREENSHOT_SERVICE_URL = process.env.OG_SCREENSHOT_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const login = req.query.login as string;
  if (!login) return res.status(400).json({ error: "Missing login" });

  try {
    const user = await prisma.user.findFirst({
      where: {
        ftSchoolVerified: true,
        extended42Data: { path: ["login"], equals: login },
      } as any,
      select: { id: true, ogImageUrl: true, ogImageAt: true, isPublicProfile: true } as any,
    });

    if (!user || !(user as any).isPublicProfile) {
      return res.status(404).json({ error: "Not found" });
    }

    const ogImageUrl = (user as any).ogImageUrl as string | null;
    const ogImageAt = (user as any).ogImageAt as Date | null;

    if (ogImageUrl && ogImageAt && Date.now() - new Date(ogImageAt).getTime() < OG_CACHE_MS) {
      res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=43200");
      return res.redirect(302, ogImageUrl);
    }

    if (!SCREENSHOT_SERVICE_URL) {
      if (ogImageUrl) return res.redirect(302, ogImageUrl);
      return res.status(503).json({ error: "Screenshot service not configured" });
    }

    const screenshotUrl = `${SCREENSHOT_SERVICE_URL}/screenshot?url=${encodeURIComponent(`https://42cv.dev/${login}?preview=1`)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    let pngBuffer: Buffer;
    try {
      const screenshotRes = await fetch(screenshotUrl, {
        signal: controller.signal,
        headers: { "x-og-secret": process.env.OG_SCREENSHOT_SECRET ?? "" },
      });
      clearTimeout(timeout);
      if (!screenshotRes.ok) throw new Error(`Screenshot service returned ${screenshotRes.status}`);
      pngBuffer = Buffer.from(await screenshotRes.arrayBuffer());
    } catch (err: any) {
      clearTimeout(timeout);
      console.error(`[og] Screenshot failed for ${login}:`, err.message);
      if (ogImageUrl) return res.redirect(302, ogImageUrl);
      return res.status(502).json({ error: "Screenshot failed" });
    }

    let cloudinaryUrl: string;
    try {
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { public_id: `og_previews/${login}`, overwrite: true, format: "png", resource_type: "image" },
            (err, result) => (err ? reject(err) : resolve(result))
          )
          .end(pngBuffer);
      });
      cloudinaryUrl = result.secure_url;
    } catch (err: any) {
      console.error(`[og] Cloudinary upload failed for ${login}:`, err.message);
      if (ogImageUrl) return res.redirect(302, ogImageUrl);
      return res.status(502).json({ error: "Upload failed" });
    }

    await prisma.user.update({
      where: { id: user.id as unknown as string },
      data: { ogImageUrl: cloudinaryUrl, ogImageAt: new Date() } as any,
    });

    res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=43200");
    return res.redirect(302, cloudinaryUrl);
  } catch (err: any) {
    console.error(`[og] Error for ${login}:`, err.message);
    return res.status(500).json({ error: "Internal error" });
  }
}
