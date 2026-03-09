import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../db";
import { axiosClientFor42 } from "../../../lib/api/42api";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_NEW_RETRIES = 10;
const RETRY_DELAY_MS = 5000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Paginate through /v2/projects to get every project slug on the platform */
async function fetchAllProjectSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  while (true) {
    const res = await axiosClientFor42.get("/v2/projects", {
      params: { "page[size]": 100, "page[number]": page },
    });
    const projects: Array<{ slug: string; parent?: { id: number } }> = res.data;
    if (!projects.length) break;
    for (const p of projects) {
      // Skip sub-projects (they have a parent)
      if (!p.parent) slugs.push(p.slug);
    }
    const total = parseInt(res.headers["x-total"] ?? "0", 10);
    if (slugs.length >= total || page * 100 >= total) break;
    page++;
  }
  return slugs;
}

/**
 * Fetch with retry for NEW entries.
 * Retries up to MAX_NEW_RETRIES with RETRY_DELAY_MS because the 42 API
 * sometimes transiently returns empty project_sessions.
 */
async function fetchWithRetry(slug: string): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_NEW_RETRIES; attempt++) {
    try {
      const { data } = await axiosClientFor42.get(`/v2/projects/${slug}`);
      const desc: string | null = data.project_sessions?.[0]?.description ?? null;
      if (desc !== null) return desc;
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
    }
    if (attempt < MAX_NEW_RETRIES - 1) await sleep(RETRY_DELAY_MS);
  }
  return null;
}

async function fetchOnce(slug: string): Promise<string | null | "error"> {
  try {
    const { data } = await axiosClientFor42.get(`/v2/projects/${slug}`);
    return data.project_sessions?.[0]?.description ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    return "error";
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = Date.now();
  let created = 0, updated = 0, touched = 0, skipped = 0;

  try {
    // 1. Get ALL project slugs from the 42 platform (paginated)
    const slugs = await fetchAllProjectSlugs();
    console.log(`[cron] Found ${slugs.length} total project slugs`);

    // 2. Load existing cache entries
    const existing = await (prisma as any).projectDescription.findMany({
      where: { slug: { in: slugs } },
    });
    const cacheMap = new Map<string, { description: string | null; checkedAt: Date }>(
      existing.map((e: any) => [e.slug, e])
    );

    // 3. Process each slug
    for (const slug of slugs) {
      const cached = cacheMap.get(slug);

      if (cached && now - new Date(cached.checkedAt).getTime() < CACHE_TTL_MS) {
        skipped++;
        continue;
      }

      if (!cached) {
        const description = await fetchWithRetry(slug);
        await (prisma as any).projectDescription.upsert({
          where: { slug },
          update: { description, checkedAt: new Date() },
          create: { slug, description, checkedAt: new Date() },
        });
        created++;
      } else {
        const fresh = await fetchOnce(slug);

        if (fresh === "error") {
          skipped++;
          continue;
        }

        if (fresh === null) {
          // Keep existing - just update checkedAt
          await (prisma as any).projectDescription.update({
            where: { slug },
            data: { checkedAt: new Date() },
          });
          touched++;
        } else if (fresh !== cached.description) {
          await (prisma as any).projectDescription.update({
            where: { slug },
            data: { description: fresh, checkedAt: new Date() },
          });
          updated++;
        } else {
          await (prisma as any).projectDescription.update({
            where: { slug },
            data: { checkedAt: new Date() },
          });
          touched++;
        }
      }
    }

    return res.status(200).json({ total: slugs.length, created, updated, touched, skipped });
  } catch (e) {
    console.error("[cron] sync-project-descriptions failed:", e);
    return res.status(500).json({ error: "Sync failed" });
  }
}
