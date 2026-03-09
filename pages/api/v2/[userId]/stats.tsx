import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, ...query } = req.query;
  const params = new URLSearchParams(query as Record<string, string>).toString();
  res.redirect(308, `/api/badge/${userId}/stats${params ? `?${params}` : ""}`);
}
