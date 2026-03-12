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
    const { isDisplayEmail, isDisplayName, isDisplayPhoto, isDisplayProjectCount, isPublicProfile, isDisplayOutstandingVotes, selectedAchievementIds, githubUrl, linkedinUrl, address, phone, defaultDarkMode, isDisplayCampusCohortRank, isDisplayCohortRank, isDisplayAllTimeRank, bio, featuredProjectIds, skillTags, projectDescriptionOverrides, photoMode } = req.body as {
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
      address?: string;
      phone?: string;
      defaultDarkMode?: string;
      isDisplayCampusCohortRank?: string;
      isDisplayCohortRank?: string;
      isDisplayAllTimeRank?: string;
      bio?: string;
      featuredProjectIds?: number[];
      skillTags?: any;
      projectDescriptionOverrides?: Record<string, string>;
    };
    if (!isDisplayEmail || !isDisplayName)
      throw new ValidateError(
        [
          !isDisplayEmail && "isDisplayEmail",
          !isDisplayName && "isDisplayName",
        ].filter(Boolean)
      );

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
        ...(address !== undefined && { address: address || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(defaultDarkMode !== undefined && { defaultDarkMode: defaultDarkMode === "true" }),
        ...(isDisplayCampusCohortRank !== undefined && { isDisplayCampusCohortRank: isDisplayCampusCohortRank === "true" }),
        ...(isDisplayCohortRank !== undefined && { isDisplayCohortRank: isDisplayCohortRank === "true" }),
        ...(isDisplayAllTimeRank !== undefined && { isDisplayAllTimeRank: isDisplayAllTimeRank === "true" }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(featuredProjectIds !== undefined && {
          featuredProjectIds: { set: featuredProjectIds },
        }),
        ...(skillTags !== undefined && { skillTags }),
        ...(projectDescriptionOverrides !== undefined && { projectDescriptionOverrides }),
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
