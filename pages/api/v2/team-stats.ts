import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../db";
import { axiosClientFor42 } from "../../../lib/api/42api";

const TEAM_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours - outstanding count can change

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { teamIds } = req.body as { teamIds: number[] };
  if (!Array.isArray(teamIds) || teamIds.length === 0) {
    return res.status(200).json({});
  }
  // Validate each element is a safe positive integer
  if (teamIds.length > 200 || teamIds.some((id) => !Number.isInteger(id) || id < 1 || id > 2147483647)) {
    return res.status(400).json({ error: "invalid teamIds" });
  }

  // Check cache first
  const cached = await (prisma as any).teamStat.findMany({
    where: { teamId: { in: teamIds } },
  });
  const result: Record<number, { totalEvals: number; outstandingCount: number }> = {};
  const now = Date.now();
  const stillNeeded: number[] = [];

  for (const s of cached) {
    result[s.teamId] = { totalEvals: s.totalEvals, outstandingCount: s.outstandingCount };
    if (now - new Date(s.checkedAt).getTime() >= TEAM_CACHE_TTL) {
      stillNeeded.push(s.teamId);
    }
  }
  const cachedIds = new Set(cached.map((s: any) => s.teamId));
  for (const id of teamIds) {
    if (!cachedIds.has(id)) stillNeeded.push(id);
  }

  // Fetch uncached/stale from 42 API in parallel
  const toUpsert: { teamId: number; totalEvals: number; outstandingCount: number }[] = [];
  await Promise.allSettled(
    stillNeeded.map(async (teamId) => {
      try {
        const { data: team } = await axiosClientFor42.get(`/v2/teams/${teamId}`);
        const scaleTeams: any[] = (team.scale_teams ?? []).filter(
          // Only count completed evaluations (evaluator showed up and filled it)
          (st: any) => st.filled_at !== null
        );
        const totalEvals = scaleTeams.length;
        const outstandingCount = scaleTeams.filter((st: any) => st.flag?.id === 9).length;
        result[teamId] = { totalEvals, outstandingCount };
        toUpsert.push({ teamId, totalEvals, outstandingCount });
      } catch {
        // skip - stars just won't show for this one
      }
    })
  );

  // Batch write all fetched results in a single transaction
  if (toUpsert.length > 0) {
    const now = new Date();
    try {
      await prisma.$transaction(
        toUpsert.map(({ teamId, totalEvals, outstandingCount }) =>
          (prisma as any).teamStat.upsert({
            where: { teamId },
            update: { totalEvals, outstandingCount, checkedAt: now },
            create: { teamId, totalEvals, outstandingCount },
          })
        )
      );
    } catch {
      // Still return what we fetched from the API
    }
  }

  return res.status(200).json(result);
}
