import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, projectId } = req.query;
  res.redirect(308, `/api/badge/${userId}/project/${projectId}`);
}
