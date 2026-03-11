import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../../../db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") {
    const token = await getToken({ req });
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      const user = await prisma.user.findUnique({ where: { email: token.email! }, select: { id: true } });
      if (!user) return res.status(404).json({ message: "User not found" });
      await cloudinary.uploader.destroy(`cv_photos/${user.id}`).catch(() => {});
      await prisma.user.update({ where: { id: user.id }, data: { customPhotoUrl: null, photoMode: "none" } });
      return res.status(200).json({ message: "deleted" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Delete failed" });
    }
  }

  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const token = await getToken({ req });
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const { dataUrl } = req.body as { dataUrl?: string };
  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return res.status(400).json({ message: "Invalid image data" });
  }

  const mimeMatch = dataUrl.match(/^data:(image\/(?:jpeg|png));base64,/);
  if (!mimeMatch) {
    return res.status(400).json({ message: "Only JPG and PNG are supported" });
  }

  // Check base64 size (~75% of actual bytes)
  const base64Data = dataUrl.split(",")[1];
  const sizeBytes = Math.ceil((base64Data.length * 3) / 4);
  if (sizeBytes > 200 * 1024) {
    return res.status(400).json({ message: "Image exceeds 200 KB limit" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: token.email! }, select: { id: true } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const result = await cloudinary.uploader.upload(dataUrl, {
      public_id: `cv_photos/${user.id}`,
      overwrite: true,
      transformation: [{ width: 512, height: 512, crop: "limit" }],
      format: "jpg",
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { customPhotoUrl: result.secure_url, photoMode: "custom" },
    });

    return res.status(200).json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Upload failed" });
  }
}
