import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../../../db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
import {
  updateUserExtends42Data,
  UserNotFound,
} from "../../../lib/updateUserExtends42Data";

class AuthError extends Error {
  constructor() {
    super();
    this.name = "AuthError";
    this.message = "Authentication failed";
  }
}

const GetHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const token = await getToken({ req });
    if (!token) throw new AuthError();

    const user = await updateUserExtends42Data({
      email: token.email,
    });

    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof AuthError || error instanceof UserNotFound) {
      return res.status(401).json({
        message: error.message,
      });
    }
    console.error(error);
    throw error;
  }
};

const DeleteHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const token = await getToken({ req });
    if (!token) throw new AuthError();

    const user = await prisma.user.findUnique({
      where: { email: token.email! },
      select: { id: true, customPhotoUrl: true },
    });

    if (user?.customPhotoUrl) {
      await cloudinary.uploader.destroy(`cv_photos/${user.id}`).catch(() => {});
    }

    await prisma.user.delete({ where: { email: token.email } });

    return res.status(200).json({ message: "success" });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({
        message: error.message,
      });
    }
    console.error(error);
    throw error;
  }
};

class ValidateError extends Error {
  constructor(fields: string[]) {
    super();
    this.name = "ValidateError";
    this.message = `Body failed validation required [${fields.join(", ")}]`;
  }
}

const PatchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { isDisplayEmail, isDisplayName, isDisplayPhoto, isDisplayProjectCount, isPublicProfile, isDisplayOutstandingVotes, selectedAchievementIds, githubUrl, linkedinUrl, websiteUrl, address, phone, defaultDarkMode, isDisplayCampusCohortRank, isDisplayCohortRank, isDisplayAllTimeRank, isDisplayJourney, bio, featuredProjectIds, skillTags, projectDescriptionOverrides, credlyBadges, photoMode } = req.body as {
      isDisplayEmail?: string;
      isDisplayName?: string;
      isDisplayPhoto?: string;
      isDisplayProjectCount?: string;
      photoMode?: string;
      isPublicProfile?: string;
      isDisplayOutstandingVotes?: string;
      selectedAchievementIds?: number[];
      githubUrl?: string;
      linkedinUrl?: string;
      websiteUrl?: string;
      address?: string;
      phone?: string;
      defaultDarkMode?: string;
      isDisplayCampusCohortRank?: string;
      isDisplayCohortRank?: string;
      isDisplayAllTimeRank?: string;
      isDisplayJourney?: string;
      bio?: string;
      featuredProjectIds?: number[];
      skillTags?: any;
      projectDescriptionOverrides?: Record<string, string>;
      credlyBadges?: { id: string; label?: string }[];
    };
    if (!isDisplayEmail || !isDisplayName)
      throw new ValidateError(
        [
          !isDisplayEmail && "isDisplayEmail",
          !isDisplayName && "isDisplayName",
        ].filter(Boolean)
      );

    // ── Input validation ──────────────────────────────────────────────
    if (bio !== undefined && bio.length > 500) return res.status(400).json({ message: "Bio too long (max 500)" });
    if (photoMode !== undefined && !["none", "42campus", "custom"].includes(photoMode)) return res.status(400).json({ message: "Invalid photoMode" });
    if (phone !== undefined && phone && !/^[\d\s\-+().]{0,20}$/.test(phone)) return res.status(400).json({ message: "Invalid phone format" });
    if (address !== undefined && address && address.length > 200) return res.status(400).json({ message: "Address too long (max 200)" });
    if (githubUrl !== undefined && githubUrl && (!/^https?:\/\//i.test(githubUrl) || githubUrl.length > 2000)) return res.status(400).json({ message: "Invalid GitHub URL" });
    if (linkedinUrl !== undefined && linkedinUrl && (!/^https?:\/\//i.test(linkedinUrl) || linkedinUrl.length > 2000)) return res.status(400).json({ message: "Invalid LinkedIn URL" });
    if (websiteUrl !== undefined && websiteUrl && (!/^https?:\/\//i.test(websiteUrl) || websiteUrl.length > 2000)) return res.status(400).json({ message: "Invalid website URL" });
    if (selectedAchievementIds !== undefined && (!Array.isArray(selectedAchievementIds) || selectedAchievementIds.length > 50)) return res.status(400).json({ message: "Invalid achievement IDs" });
    if (featuredProjectIds !== undefined && (!Array.isArray(featuredProjectIds) || featuredProjectIds.length > 5)) return res.status(400).json({ message: "Max 5 featured projects" });
    if (skillTags !== undefined) {
      if (!Array.isArray(skillTags) || skillTags.length > 20) return res.status(400).json({ message: "Invalid skillTags" });
      for (const t of skillTags) {
        if (typeof t?.category !== "string" || t.category.length > 50) return res.status(400).json({ message: "Invalid skill category" });
        if (!Array.isArray(t?.items) || t.items.length > 30 || t.items.some((i: any) => typeof i !== "string" || i.length > 50)) return res.status(400).json({ message: "Invalid skill items" });
      }
    }
    if (projectDescriptionOverrides !== undefined) {
      if (typeof projectDescriptionOverrides !== "object" || Array.isArray(projectDescriptionOverrides)) return res.status(400).json({ message: "Invalid project overrides" });
      for (const [k, v] of Object.entries(projectDescriptionOverrides)) {
        if (typeof k !== "string" || typeof v !== "string" || v.length > 1000) return res.status(400).json({ message: "Invalid project override value" });
      }
    }
    if (credlyBadges !== undefined) {
      if (!Array.isArray(credlyBadges) || credlyBadges.length > 4) return res.status(400).json({ message: "Max 4 Credly badges" });
      for (const b of credlyBadges) {
        if (typeof b?.id !== "string" || !/^[0-9a-f-]{36}$/i.test(b.id)) return res.status(400).json({ message: "Invalid Credly badge ID" });
        if (b.label !== undefined && (typeof b.label !== "string" || b.label.length > 100)) return res.status(400).json({ message: "Credly badge label too long (max 100)" });
      }
    }

    const token = await getToken({ req });
    if (!token) throw new AuthError();

    await prisma.user.update({
      where: {
        email: token.email,
      },
      data: {
        isDisplayEmail: isDisplayEmail === "true",
        isDisplayName: isDisplayName === "true",
        ...(isDisplayPhoto !== undefined && {
          isDisplayPhoto: isDisplayPhoto === "true",
        }),
        ...(isDisplayProjectCount !== undefined && {
          isDisplayProjectCount: isDisplayProjectCount === "true",
        }),
        ...(isPublicProfile !== undefined && {
          isPublicProfile: isPublicProfile === "true",
        }),
        ...(isDisplayOutstandingVotes !== undefined && {
          isDisplayOutstandingVotes: isDisplayOutstandingVotes === "true",
        }),
        ...(selectedAchievementIds !== undefined && {
          selectedAchievementIds: { set: selectedAchievementIds },
        }),
        ...(githubUrl !== undefined && { githubUrl: githubUrl || null }),
        ...(linkedinUrl !== undefined && { linkedinUrl: linkedinUrl || null }),
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl || null }),
        ...(address !== undefined && { address: address || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(defaultDarkMode !== undefined && { defaultDarkMode: defaultDarkMode === "true" }),
        ...(isDisplayCampusCohortRank !== undefined && { isDisplayCampusCohortRank: isDisplayCampusCohortRank === "true" }),
        ...(isDisplayCohortRank !== undefined && { isDisplayCohortRank: isDisplayCohortRank === "true" }),
        ...(isDisplayAllTimeRank !== undefined && { isDisplayAllTimeRank: isDisplayAllTimeRank === "true" }),
        ...(isDisplayJourney !== undefined && { isDisplayJourney: isDisplayJourney === "true" }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(featuredProjectIds !== undefined && {
          featuredProjectIds: { set: featuredProjectIds },
        }),
        ...(skillTags !== undefined && { skillTags }),
        ...(projectDescriptionOverrides !== undefined && { projectDescriptionOverrides }),
        ...(credlyBadges !== undefined && { credlyBadges }),
        ...(photoMode !== undefined && { photoMode }),
      },
    });

    return res.status(200).json({
      message: "success",
    });
  } catch (error) {
    if (error instanceof ValidateError) {
      return res.status(400).json({
        message: error.message,
      });
    }
    if (error instanceof AuthError) {
      return res.status(401).json({
        message: error.message,
      });
    }
    console.error(error);
    throw error;
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return GetHandler(req, res);
    case "DELETE":
      return DeleteHandler(req, res);
    case "PATCH":
      return PatchHandler(req, res);
  }
  res.status(405).json({
    error: "method not allowed",
  });
}
