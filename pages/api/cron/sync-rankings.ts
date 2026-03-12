import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import prisma from "../../../db";
import { axiosClientFor42, queue } from "../../../lib/api/42api";

// ─── Checkpoint (resume on crash/timeout) ────────────────────────────────────

const CHECKPOINT_KEY = "rankings";
const CHECKPOINT_TTL_MS = 4 * 60 * 60 * 1000; // discard if older than 4h

type Entry = { login: string; level: number; poolYear: string };

type Checkpoint = {
  entries: Entry[];                                                      // global entries so far
  nextPage: number;                                                      // next global page to fetch
  total: number;                                                         // global total hint
  globalDone: boolean;                                                   // true once global fetch is complete
  doneCampusIds: number[];                                               // campus IDs fully processed
  campusCohortRankMap: Record<string, { rank: number; total: number }>; // accumulated campus ranks
  loginCampusMap: Record<string, number>;                                // login → campusId
  savedAt: number;
};

async function loadCheckpoint(): Promise<Checkpoint | null> {
  try {
    const row = await (prisma as any).cronCheckpoint.findUnique({ where: { key: CHECKPOINT_KEY } });
    if (!row) return null;
    const raw: any = row.data;
    if (Date.now() - new Date(row.savedAt).getTime() > CHECKPOINT_TTL_MS) return null;
    // Spread raw first to preserve dynamic keys (campus_* partial progress),
    // then override with typed defaults for known fields
    return {
      ...raw,
      entries: raw.entries ?? [],
      nextPage: raw.nextPage ?? 1,
      total: raw.total ?? 0,
      globalDone: raw.globalDone ?? false,
      doneCampusIds: raw.doneCampusIds ?? [],
      campusCohortRankMap: raw.campusCohortRankMap ?? {},
      loginCampusMap: raw.loginCampusMap ?? {},
      savedAt: new Date(row.savedAt).getTime(),
    };
  } catch {
    return null;
  }
}

async function saveCheckpoint(cp: Omit<Checkpoint, "savedAt">) {
  await (prisma as any).cronCheckpoint.upsert({
    where: { key: CHECKPOINT_KEY },
    update: { data: cp },
    create: { key: CHECKPOINT_KEY, data: cp },
  });
}

async function clearCheckpoint() {
  try {
    await (prisma as any).cronCheckpoint.delete({ where: { key: CHECKPOINT_KEY } });
  } catch {}
}

// 42 API group IDs - same as The-Official-New-Leets
const TEST_ACCOUNT_GROUP = 119;
const STAFF_GROUP = 1;
const BLOCKED_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Blocked logins (DB-cached, refreshed monthly) ───────────────────────────

async function fetchGroupLogins(groupId: number): Promise<string[]> {
  const logins: string[] = [];
  let page = 1;
  while (true) {
    const res = await queue.add(() =>
      axiosClientFor42.get(`/v2/groups/${groupId}/users`, {
        params: { "page[size]": 100, "page[number]": page },
      })
    );
    const users: Array<{ login: string }> = res.data;
    if (!users.length) break;
    logins.push(...users.map((u) => u.login));
    if (users.length < 100) break;
    page++;
  }
  return logins;
}

async function getBlockedLogins(): Promise<Set<string>> {
  const cached = await (prisma as any).blockedLoginsCache.findUnique({ where: { id: 1 } });
  if (cached && Date.now() - new Date(cached.updatedAt).getTime() < BLOCKED_TTL_MS) {
    console.log(`[rankings] Blocked logins from cache (${cached.logins.length})`);
    return new Set(cached.logins);
  }
  console.log("[rankings] Refreshing blocked logins from 42 API...");
  const [testLogins, staffLogins] = await Promise.all([
    fetchGroupLogins(TEST_ACCOUNT_GROUP),
    fetchGroupLogins(STAFF_GROUP),
  ]);
  const logins = [...new Set([...testLogins, ...staffLogins])];
  await (prisma as any).blockedLoginsCache.upsert({
    where: { id: 1 },
    update: { logins },
    create: { id: 1, logins },
  });
  console.log(`[rankings] Blocked logins refreshed (${logins.length})`);
  return new Set(logins);
}

// ─── API fetchers ─────────────────────────────────────────────────────────────

type CampusEntry = { login: string; level: number; poolYear: string };

async function fetchGlobalEntries(blocked: Set<string>, cp: Checkpoint): Promise<Entry[]> {
  if (cp.globalDone) {
    console.log(`[rankings] Global fetch already done (${cp.entries.length} entries from checkpoint)`);
    return cp.entries;
  }

  const entries: Entry[] = [...cp.entries];
  let page = cp.nextPage;

  if (page > 1) {
    console.log(`[rankings] Resuming global fetch from page ${page} (${entries.length} entries so far)`);
  }

  while (true) {
    const res = await queue.add(() =>
      axiosClientFor42.get("/v2/cursus_users", {
        params: { "filter[cursus_id]": 21, sort: "-level", "page[size]": 100, "page[number]": page },
      })
    );
    const items: any[] = res.data;
    if (!items.length) break;
    for (const item of items) {
      const u = item.user;
      if (u.staff === true || u.kind !== "student" || blocked.has(u.login)) continue;
      entries.push({ login: u.login, level: item.level, poolYear: u.pool_year ?? "" });
    }
    const total = parseInt(res.headers["x-total"] ?? "0", 10);
    if (page % 10 === 0 || page * 100 >= total) {
      await saveCheckpoint({ ...cp, entries, nextPage: page + 1, total, globalDone: false });
    }
    if (page * 100 >= total) break;
    page++;
  }

  // Mark global as done so a crash before campus fetch doesn't lose this work
  await saveCheckpoint({ ...cp, entries, globalDone: true });
  console.log(`[rankings] Global fetch done: ${entries.length} students`);
  return entries;
}

async function fetchCampusEntries(
  campusId: number,
  blocked: Set<string>,
  cp: Checkpoint,
): Promise<CampusEntry[]> {
  // Resume from checkpoint if this campus was partially fetched
  const cpKey = `campus_${campusId}`;
  const partial = (cp as any)[cpKey] as { entries: CampusEntry[]; nextPage: number } | undefined;
  const entries: CampusEntry[] = partial?.entries ?? [];
  let page = partial?.nextPage ?? 1;

  if (page > 1) {
    console.log(`[rankings] Resuming campus ${campusId} from page ${page} (${entries.length} entries so far)`);
  }

  while (true) {
    const res = await queue.add(() =>
      axiosClientFor42.get("/v2/cursus_users", {
        params: { "filter[cursus_id]": 21, "filter[campus_id]": campusId, sort: "-level", "page[size]": 100, "page[number]": page },
      })
    );
    const items: any[] = res.data;
    if (!items.length) break;
    for (const item of items) {
      const u = item.user;
      if (u.staff === true || u.kind !== "student" || blocked.has(u.login)) continue;
      entries.push({ login: u.login, level: item.level, poolYear: u.pool_year ?? "" });
    }
    const total = parseInt(res.headers["x-total"] ?? "0", 10);
    if (page % 10 === 0 || page * 100 >= total) {
      await saveCheckpoint({ ...cp, [cpKey]: { entries, nextPage: page + 1 } });
    }
    if (page * 100 >= total) break;
    page++;
  }

  // Clean up partial campus checkpoint now that it's done
  delete (cp as any)[cpKey];
  return entries;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = req.headers.authorization ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Load or init checkpoint
    const cp: Checkpoint = (await loadCheckpoint()) ?? {
      entries: [],
      nextPage: 1,
      total: 0,
      globalDone: false,
      doneCampusIds: [],
      campusCohortRankMap: {},
      loginCampusMap: {},
      savedAt: Date.now(),
    };

    // 1. Blocked logins (DB-cached monthly)
    const blocked = await getBlockedLogins();

    // 2. Global fetch - all-time + cohort rankings for every student
    const allTimeRankMap = new Map<string, { rank: number; total: number }>();
    const cohortRankMap = new Map<string, { rank: number; total: number }>();

    console.log("[rankings] Fetching global list...");
    const global = await fetchGlobalEntries(blocked, cp);

    cp.entries = global;
    cp.globalDone = true;

    const allTimeTotal = global.length;
    global.forEach((e, i) => allTimeRankMap.set(e.login, { rank: i + 1, total: allTimeTotal }));

    const cohortGroups = new Map<string, Entry[]>();
    for (const e of global) {
      if (!e.poolYear) continue;
      if (!cohortGroups.has(e.poolYear)) cohortGroups.set(e.poolYear, []);
      cohortGroups.get(e.poolYear)!.push(e);
    }
    for (const members of cohortGroups.values()) {
      members.forEach((e, i) =>
        cohortRankMap.set(e.login, { rank: i + 1, total: members.length })
      );
    }

    // 3. Per-campus fetch - campus-cohort
    //    Only fetch campuses where a 42cv user is enrolled
    const campusCohortRankMap = new Map<string, { rank: number; total: number }>(
      Object.entries(cp.campusCohortRankMap)
    );
    const loginCampusMap = new Map<string, number>(
      Object.entries(cp.loginCampusMap).map(([k, v]) => [k, v as number])
    );

    const dbUsers = await (prisma as any).user.findMany({
      where: { ftSchoolVerified: true },
      select: { extended42Data: true },
    });
    const campusIds = new Set<number>();
    for (const u of dbUsers) {
      const d = u.extended42Data as any;
      if (!d) continue;
      const primaryCu =
        (d.campus_users ?? []).find((cu: any) => cu.is_primary) ?? d.campus_users?.[0];
      if (primaryCu?.campus_id) campusIds.add(primaryCu.campus_id);
    }

    for (const campusId of campusIds) {
      if (cp.doneCampusIds.includes(campusId)) {
        console.log(`[rankings] Campus ${campusId}: skipped (already in checkpoint)`);
        continue;
      }

      console.log(`[rankings] Fetching campus ${campusId}...`);
      const list = await fetchCampusEntries(campusId, blocked, cp);
      console.log(`[rankings] Campus ${campusId}: ${list.length} students`);

      for (const item of list) {
        loginCampusMap.set(item.login, campusId);
      }

      const groups = new Map<string, CampusEntry[]>();
      for (const item of list) {
        if (!item.poolYear) continue;
        const key = `${campusId}/${item.poolYear}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
      }
      for (const members of groups.values()) {
        members.forEach((item, i) =>
          campusCohortRankMap.set(item.login, { rank: i + 1, total: members.length })
        );
      }

      cp.doneCampusIds.push(campusId);
      await saveCheckpoint({
        ...cp,
        campusCohortRankMap: Object.fromEntries(campusCohortRankMap),
        loginCampusMap: Object.fromEntries(loginCampusMap),
      });
    }

    // 4. Bulk upsert RankingCache for ALL students via raw SQL
    //    Build lookup maps for level/poolYear from global entries
    const levelMap = new Map<string, number>();
    const poolYearMap = new Map<string, string>();
    for (const e of global) {
      levelMap.set(e.login, e.level);
      if (e.poolYear) poolYearMap.set(e.login, e.poolYear);
    }

    const now = new Date();
    const allLogins = new Set([
      ...allTimeRankMap.keys(),
      ...campusCohortRankMap.keys(),
    ]);
    let upserted = 0;

    const BATCH_SIZE = 1000;
    const COLS = 11;
    const loginArray = Array.from(allLogins);
    for (let i = 0; i < loginArray.length; i += BATCH_SIZE) {
      const batch = loginArray.slice(i, i + BATCH_SIZE);
      const values: any[] = [];
      const placeholders: string[] = [];

      for (let j = 0; j < batch.length; j++) {
        const login = batch[j];
        const allTime = allTimeRankMap.get(login);
        const cohort = cohortRankMap.get(login);
        const campusCohort = campusCohortRankMap.get(login);
        const off = j * COLS;
        placeholders.push(
          `($${off + 1}, $${off + 2}::double precision, $${off + 3}, $${off + 4}::integer, $${off + 5}, $${off + 6}, $${off + 7}, $${off + 8}, $${off + 9}, $${off + 10}, $${off + 11})`
        );
        values.push(
          login,
          levelMap.get(login) ?? null,
          poolYearMap.get(login) ?? null,
          loginCampusMap.get(login) ?? null,
          allTime?.rank ?? null,
          allTime?.total ?? null,
          cohort?.rank ?? null,
          cohort?.total ?? null,
          campusCohort?.rank ?? null,
          campusCohort?.total ?? null,
          now,
        );
      }

      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "RankingCache" ("login", "level", "poolYear", "campusId", "allTimeRank", "allTimeTotal", "cohortRank", "cohortTotal", "campusCohortRank", "campusCohortTotal", "checkedAt")
         VALUES ${placeholders.join(", ")}
         ON CONFLICT ("login") DO UPDATE SET
           "level" = EXCLUDED."level",
           "poolYear" = EXCLUDED."poolYear",
           "campusId" = EXCLUDED."campusId",
           "allTimeRank" = EXCLUDED."allTimeRank",
           "allTimeTotal" = EXCLUDED."allTimeTotal",
           "cohortRank" = EXCLUDED."cohortRank",
           "cohortTotal" = EXCLUDED."cohortTotal",
           "campusCohortRank" = EXCLUDED."campusCohortRank",
           "campusCohortTotal" = EXCLUDED."campusCohortTotal",
           "checkedAt" = EXCLUDED."checkedAt"`,
        ...values
      );
      upserted += batch.length;
    }

    await clearCheckpoint();
    console.log(`[rankings] Done: ${upserted} students ranked`);
    return res.status(200).json({ blocked: blocked.size, ranked: upserted });
  } catch (e) {
    console.error("[cron] sync-rankings failed:", e);
    return res.status(500).json({ error: "Sync failed" });
  }
}
