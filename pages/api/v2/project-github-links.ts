import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import prisma from "../../../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT" && req.method !== "DELETE") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const token = await getToken({ req });
  if (!token?.email) {
    return res.status(401).json({ error: "not authenticated" });
  }

  const user = await prisma.user.findUnique({ where: { email: token.email }, select: { id: true } });
  if (!user) {
    return res.status(401).json({ error: "user not found" });
  }

  const { projectSlug } = req.body as { projectSlug?: string };
  if (!projectSlug || typeof projectSlug !== "string") {
    return res.status(400).json({ error: "projectSlug is required" });
  }

  if (req.method === "DELETE") {
    await prisma.projectGithubLink.deleteMany({
      where: { userId: user.id, projectSlug },
    });
    return res.status(200).json({ message: "deleted" });
  }

  // PUT - upsert
  const { githubUrl } = req.body as { githubUrl?: string };
  if (!githubUrl || typeof githubUrl !== "string") {
    return res.status(400).json({ error: "githubUrl is required" });
  }

  // Basic URL validation
  try {
    const url = new URL(githubUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      return res.status(400).json({ error: "invalid URL" });
    }
  } catch {
    return res.status(400).json({ error: "invalid URL" });
  }

  await prisma.projectGithubLink.upsert({
    where: { userId_projectSlug: { userId: user.id, projectSlug } },
    create: { userId: user.id, projectSlug, githubUrl },
    update: { githubUrl },
  });

  return res.status(200).json({ message: "saved" });
}
