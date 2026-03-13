import prisma from "../db";
import { axiosClientFor42, get42OauthToken } from "../lib/api/42api";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_NEW_RETRIES = 10;
const RETRY_DELAY_MS = 5000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initToken() {
  const { data: token } = await get42OauthToken();
  axiosClientFor42.defaults.headers.common["Authorization"] = `Bearer ${token.access_token}`;
  console.log("[init] OAuth token acquired");
}

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
      if (!p.parent) slugs.push(p.slug);
    }
    const total = parseInt(res.headers["x-total"] ?? "0", 10);
    if (slugs.length >= total || page * 100 >= total) break;
    page++;
  }
  return slugs;
}

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

async function main() {
  await initToken();

  const now = Date.now();
  let created = 0, updated = 0, touched = 0, skipped = 0;

  const slugs = await fetchAllProjectSlugs();
  console.log(`[sync] Found ${slugs.length} project slugs`);

  const existing = await (prisma as any).projectDescription.findMany({
    where: { slug: { in: slugs } },
  });
  const cacheMap = new Map<string, { description: string | null; checkedAt: Date }>(
    existing.map((e: any) => [e.slug, e])
  );

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
      if (fresh === "error") { skipped++; continue; }

      if (fresh === null || fresh === cached.description) {
        await (prisma as any).projectDescription.update({
          where: { slug },
          data: { checkedAt: new Date() },
        });
        touched++;
      } else {
        await (prisma as any).projectDescription.update({
          where: { slug },
          data: { description: fresh, checkedAt: new Date() },
        });
        updated++;
      }
    }

    if ((created + updated + touched) % 100 === 0 && (created + updated + touched) > 0) {
      console.log(`[sync] Progress: ${created} created, ${updated} updated, ${touched} touched, ${skipped} skipped`);
    }
  }

  console.log(`[sync] Done: ${slugs.length} total, ${created} created, ${updated} updated, ${touched} touched, ${skipped} skipped`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[sync] Fatal:", e);
  process.exit(1);
});
