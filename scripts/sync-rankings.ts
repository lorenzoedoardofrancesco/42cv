import prisma from "../db";
import { axiosClientFor42, get42OauthToken, queue } from "../lib/api/42api";

const TEST_ACCOUNT_GROUP = 119;
const STAFF_GROUP = 1;
const BLOCKED_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const MONTH_NAMES = ["january","february","march","april","may","june","july","august","september","october","november","december"];

type Entry = { login: string; level: number; cohortYear: string; cohortMonth: string };

/** Derive cohort from begin_at (student since), with pool fallback for transfers (>6mo gap). */
function effectiveCohort(beginAt: string, poolYear: string, poolMonth: string): { year: string; month: string } {
  const d = new Date(beginAt);
  const beginMonths = d.getFullYear() * 12 + d.getMonth();
  const poolMonthNum = MONTH_NAMES.indexOf(poolMonth.toLowerCase()) + 1;
  const poolYearNum = parseInt(poolYear, 10);
  if (poolYearNum && poolMonthNum) {
    const poolMonths = poolYearNum * 12 + (poolMonthNum - 1);
    if (Math.abs(beginMonths - poolMonths) > 6) {
      return { year: poolYear, month: poolMonth };
    }
  }
  return { year: d.getFullYear().toString(), month: MONTH_NAMES[d.getMonth()] ?? "" };
}

async function initToken() {
  const { data: token } = await get42OauthToken();
  axiosClientFor42.defaults.headers.common["Authorization"] = `Bearer ${token.access_token}`;
  console.log("[init] OAuth token acquired");
}

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
    console.log(`[blocked] From cache (${cached.logins.length})`);
    return new Set(cached.logins);
  }
  console.log("[blocked] Refreshing from 42 API...");
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
  console.log(`[blocked] Refreshed (${logins.length})`);
  return new Set(logins);
}

async function fetchGlobalEntries(blocked: Set<string>): Promise<Entry[]> {
  const entries: Entry[] = [];
  let page = 1;
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
      const cohort = effectiveCohort(item.begin_at ?? "", u.pool_year ?? "", u.pool_month ?? "");
      entries.push({
        login: u.login,
        level: item.level,
        cohortYear: cohort.year,
        cohortMonth: cohort.month,
      });
    }
    const total = parseInt(res.headers["x-total"] ?? "0", 10);
    if (page % 50 === 0) console.log(`[global] Page ${page} — ${entries.length} entries so far (total ~${total})`);
    if (page * 100 >= total) break;
    page++;
  }
  console.log(`[global] Done: ${entries.length} students`);
  return entries;
}

async function fetchCampusEntries(campusId: number, blocked: Set<string>): Promise<Entry[]> {
  const entries: Entry[] = [];
  let page = 1;
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
      const cohort = effectiveCohort(item.begin_at ?? "", u.pool_year ?? "", u.pool_month ?? "");
      entries.push({
        login: u.login,
        level: item.level,
        cohortYear: cohort.year,
        cohortMonth: cohort.month,
      });
    }
    const total = parseInt(res.headers["x-total"] ?? "0", 10);
    if (page * 100 >= total) break;
    page++;
  }
  return entries;
}

function cohortKey(e: Entry): string {
  return `${e.cohortYear}-${e.cohortMonth}`;
}

async function main() {
  await initToken();

  const blocked = await getBlockedLogins();

  // 1. Global fetch
  console.log("[rankings] Fetching global list...");
  const global = await fetchGlobalEntries(blocked);

  // 2. All-time ranks
  const allTimeRankMap = new Map<string, { rank: number; total: number }>();
  global.forEach((e, i) => allTimeRankMap.set(e.login, { rank: i + 1, total: global.length }));

  // 3. Global cohort ranks — by year only (campuses have different start months)
  const cohortRankMap = new Map<string, { rank: number; total: number }>();
  const cohortGroups = new Map<string, Entry[]>();
  for (const e of global) {
    if (!e.cohortYear) continue;
    if (!cohortGroups.has(e.cohortYear)) cohortGroups.set(e.cohortYear, []);
    cohortGroups.get(e.cohortYear)!.push(e);
  }
  for (const members of cohortGroups.values()) {
    members.forEach((e, i) => cohortRankMap.set(e.login, { rank: i + 1, total: members.length }));
  }
  console.log(`[rankings] ${cohortGroups.size} yearly cohorts`);

  // 4. Per-campus fetch — only campuses where our users are
  const campusCohortRankMap = new Map<string, { rank: number; total: number }>();
  const loginCampusMap = new Map<string, number>();

  const dbUsers = await (prisma as any).user.findMany({
    where: { ftSchoolVerified: true },
    select: { extended42Data: true },
  });
  const campusIds = new Set<number>();
  for (const u of dbUsers) {
    const d = u.extended42Data as any;
    if (!d) continue;
    const primaryCu = (d.campus_users ?? []).find((cu: any) => cu.is_primary) ?? d.campus_users?.[0];
    if (primaryCu?.campus_id) campusIds.add(primaryCu.campus_id);
  }

  for (const campusId of campusIds) {
    console.log(`[rankings] Fetching campus ${campusId}...`);
    const list = await fetchCampusEntries(campusId, blocked);
    console.log(`[rankings] Campus ${campusId}: ${list.length} students`);

    for (const item of list) loginCampusMap.set(item.login, campusId);

    const groups = new Map<string, Entry[]>();
    for (const item of list) {
      if (!item.cohortYear) continue;
      const key = `${campusId}/${cohortKey(item)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    for (const members of groups.values()) {
      members.forEach((item, i) => campusCohortRankMap.set(item.login, { rank: i + 1, total: members.length }));
    }
  }

  // 5. Bulk upsert
  const levelMap = new Map<string, number>();
  const cohortYearMap = new Map<string, string>();
  const cohortMonthMap = new Map<string, string>();
  for (const e of global) {
    levelMap.set(e.login, e.level);
    if (e.cohortYear) cohortYearMap.set(e.login, e.cohortYear);
    if (e.cohortMonth) cohortMonthMap.set(e.login, e.cohortMonth);
  }

  const now = new Date();
  const allLogins = new Set([...allTimeRankMap.keys(), ...campusCohortRankMap.keys()]);
  let upserted = 0;

  const BATCH_SIZE = 1000;
  const COLS = 12;
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
        `($${off + 1}, $${off + 2}::double precision, $${off + 3}, $${off + 4}, $${off + 5}::integer, $${off + 6}, $${off + 7}, $${off + 8}, $${off + 9}, $${off + 10}, $${off + 11}, $${off + 12})`
      );
      values.push(
        login,
        levelMap.get(login) ?? null,
        cohortYearMap.get(login) ?? null,
        cohortMonthMap.get(login) ?? null,
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
      `INSERT INTO "RankingCache" ("login", "level", "poolYear", "poolMonth", "campusId", "allTimeRank", "allTimeTotal", "cohortRank", "cohortTotal", "campusCohortRank", "campusCohortTotal", "checkedAt")
       VALUES ${placeholders.join(", ")}
       ON CONFLICT ("login") DO UPDATE SET
         "level" = EXCLUDED."level",
         "poolYear" = EXCLUDED."poolYear",
         "poolMonth" = EXCLUDED."poolMonth",
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
    if ((i + BATCH_SIZE) % 5000 === 0) console.log(`[rankings] Upserted ${upserted}...`);
  }

  console.log(`[rankings] Done: ${upserted} students ranked`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[rankings] Fatal:", e);
  process.exit(1);
});
