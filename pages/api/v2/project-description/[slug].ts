import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../db";
import { axiosClientFor42 } from "../../../../lib/api/42api";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { slug } = req.query as { slug: string };

  try {
    // Check DB cache first
    const cached = await (prisma as any).projectDescription.findUnique({
      where: { slug },
    });

    if (cached && Date.now() - new Date(cached.checkedAt).getTime() < CACHE_TTL_MS) {
      return res.status(200).json({ description: cached.description });
    }

    // Fetch from 42 API
    const { data } = await axiosClientFor42.get(`/v2/projects/${slug}`);
    const session = data.project_sessions?.[0];
    const description: string | null = session?.description ?? null;
    const scales: any[] = session?.scales ?? [];
    const primaryScale = scales.find((s: any) => s.is_primary) ?? scales[0] ?? null;
    const correctionNumber: number | null = primaryScale?.correction_number ?? null;

    // Update rules: don't overwrite an existing description with null
    const newDescription = cached?.description && description === null ? cached.description : description;
    const newCorrectionNumber = correctionNumber ?? cached?.correctionNumber ?? null;

    await (prisma as any).projectDescription.upsert({
      where: { slug },
      update: { description: newDescription, correctionNumber: newCorrectionNumber, checkedAt: new Date() },
      create: { slug, description, correctionNumber },
    });

    return res.status(200).json({ description: newDescription, correctionNumber: newCorrectionNumber });
  } catch (e: any) {
    if (e?.response?.status === 404) {
      return res.status(200).json({ description: null });
    }
    // Return cached description if we have it (don't fail the user)
    const cached = await (prisma as any).projectDescription.findUnique({ where: { slug } }).catch(() => null);
    if (cached?.description) return res.status(200).json({ description: cached.description });
    return res.status(500).json({ error: "Failed to fetch project" });
  }
}
