import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../db";
import fs from "fs";
import path from "path";

const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_DIR = "/tmp/screenshot_cache";

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

async function takeScreenshot(login: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer-core");
  const browser = await puppeteer.default.launch({
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      "/nix/var/nix/profiles/default/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.startsWith("https://42cv.dev/")) {
        req.continue({ url: url.replace("https://42cv.dev/", "http://localhost:3000/") });
      } else {
        req.continue();
      }
    });
    await page.setViewport({ width: 1200, height: 900 });
    await page.goto(`http://localhost:3000/${login}`, {
      waitUntil: "networkidle0",
      timeout: 15000,
    });
    const buffer = await page.screenshot({ type: "png" });
    return Buffer.from(buffer);
  } finally {
    await browser.close();
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const login = req.query.login as string;
  if (!login) return res.status(400).json({ error: "Missing login" });

  try {
    if (login !== "demo") {
      const user = await prisma.user.findFirst({
        where: {
          ftSchoolVerified: true,
          extended42Data: { path: ["login"], equals: login },
        } as any,
        select: { isPublicProfile: true } as any,
      });

      if (!user || !(user as any).isPublicProfile) {
        return res.status(404).json({ error: "Not found" });
      }
    }

    ensureCacheDir();
    const cachePath = path.join(CACHE_DIR, `${login}.png`);

    if (fs.existsSync(cachePath)) {
      const stat = fs.statSync(cachePath);
      if (Date.now() - stat.mtimeMs < CACHE_MS) {
        const png = fs.readFileSync(cachePath);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=172800");
        return res.send(png);
      }
    }

    let pngBuffer: Buffer;
    try {
      pngBuffer = await takeScreenshot(login);
    } catch (err: any) {
      console.error(`[screenshot] Failed for ${login}:`, err.message);
      if (fs.existsSync(cachePath)) {
        const png = fs.readFileSync(cachePath);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, s-maxage=3600");
        return res.send(png);
      }
      return res.status(502).json({ error: "Screenshot failed" });
    }

    fs.writeFileSync(cachePath, pngBuffer);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=172800");
    return res.send(pngBuffer);
  } catch (err: any) {
    console.error(`[screenshot] Error for ${login}:`, err.message);
    return res.status(500).json({ error: "Internal error" });
  }
}
