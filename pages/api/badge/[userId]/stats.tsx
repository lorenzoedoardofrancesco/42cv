import collection from "lodash-es/collection";
import type { NextApiRequest, NextApiResponse } from "next";
import ReactDomServer from "react-dom/server";
import Stats from "../../../../components/badge/Stats";
import { getBase64ImageFromUrl } from "../../../../lib/getBase64ImageFromUrl";
import getCoalitions from "../../../../lib/getCoalitions";
import {
  updateUserExtends42Data,
  UserNotFound,
  EXPIRE_TIME,
} from "../../../../lib/updateUserExtends42Data";
import { FTAccountNotLinked } from "../../../../lib/errors";

const GetHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId, cursusId, coalitionId } = req.query as {
      userId: string;
      cursusId?: string;
      coalitionId?: string;
    };

    const user = await updateUserExtends42Data({
      id: userId,
    });

    const accounts = collection.keyBy(user.accounts, "provider");
    if (!accounts["42-school"]) throw new FTAccountNotLinked();

    const cursus_users = collection.keyBy(
      user.extended42Data.cursus_users,
      "cursus_id"
    );

    const cursus_user = cursusId
      ? cursus_users[cursusId]
      : user.extended42Data.cursus_users[
          user.extended42Data.cursus_users.length - 1
        ];

    const coalition = getCoalitions(
      coalitionId ??
        (cursus_user.cursus.slug.includes("piscine")
          ? "piscine"
          : user.extended42Data.coalitions.length
          ? user.extended42Data.coalitions[
              user.extended42Data.coalitions.length - 1
            ].id.toString()
          : "undefined"),
      user.extended42Data.coalitions
    );

    const primaryCampus =
      collection.find(
        user.extended42Data.campus,
        (campus) =>
          campus.id ===
          (
            collection.find(
              user.extended42Data.campus_users,
              (campus_user) => campus_user.is_primary
            ) ?? user.extended42Data.campus_users[0]
          ).campus_id
      ) ?? user.extended42Data.campus[0];

    const photoMode = (user as any).photoMode ?? "none";
    const customPhotoUrl = (user as any).customPhotoUrl ?? null;
    let profileImage: string | null = null;
    if (user.isDisplayPhoto) {
      if (photoMode === "custom" && customPhotoUrl) {
        profileImage = await getBase64ImageFromUrl(encodeURI(customPhotoUrl)).catch(() => null);
      } else {
        const profileImageUrl = user.extended42Data.image?.versions?.small ||
          user.extended42Data.image?.link ||
          user.extended42Data.image_url;
        profileImage = profileImageUrl
          ? await getBase64ImageFromUrl(encodeURI(profileImageUrl)).catch(() => null)
          : null;
      }
    }

    // Fetch Credly badge images (up to 4) as base64
    const rawBadges = ((user as any).credlyBadges as { id: string; imageUrl?: string; name?: string }[] | null) ?? [];
    const credlyBadges = (
      await Promise.all(
        rawBadges.slice(0, 4).map(async (b) => {
          if (!b.imageUrl) return null;
          const imageUrl = await getBase64ImageFromUrl(encodeURI(b.imageUrl)).catch(() => null);
          if (!imageUrl) return null;
          return { imageUrl, name: b.name };
        })
      )
    ).filter(Boolean) as { imageUrl: string; name?: string }[];

    if (process.env.NODE_ENV === "production") {
      const ExpiresDate = new Date();
      ExpiresDate.setSeconds(ExpiresDate.getSeconds() + EXPIRE_TIME);
      res.setHeader("Cache-Control", `public, s-maxage=${EXPIRE_TIME}, stale-while-revalidate=${EXPIRE_TIME * 2}`);
      res.setHeader("Expires", ExpiresDate.toISOString());
    }

    res.setHeader("Content-Type", "image/svg+xml");
    return res.status(200).send(
      ReactDomServer.renderToStaticMarkup(
        <Stats
          data={{
            login: user.extended42Data.login,
            name: user.isDisplayName && user.extended42Data.displayname,
            campus: `42${primaryCampus.name}`,
            begin_at: cursus_user.begin_at,
            end_at: cursus_user.end_at,
            blackholed_at: cursus_user.blackholed_at,
            cursus: cursus_user.cursus.name,
            grade: cursus_user.grade ?? "Pisciner",
            color: coalition.color,
            email: user.isDisplayEmail && user.extended42Data.email,
            level: cursus_user.level,
            profileImage: profileImage,
            projectCount: (user as any).isDisplayProjectCount ?? true
              ? user.extended42Data.projects_users.filter(
                  (p) =>
                    p["validated?"] === true &&
                    !p.project.parent_id &&
                    p.cursus_ids.includes(cursus_user.cursus_id)
                ).length
              : null,
            credlyBadges: credlyBadges.length > 0 ? credlyBadges : undefined,
          }}
        />
      )
    );
  } catch (error) {
    console.error(error);
    if (error instanceof UserNotFound) {
      res.setHeader("Cache-Control", "public, s-maxage=300");
      return res.status(401).json({
        error: error.message,
      });
    }
    if (error instanceof FTAccountNotLinked) {
      res.setHeader("Cache-Control", "public, s-maxage=300");
      return res.status(403).json({
        error: error.message,
      });
    }
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return GetHandler(req, res);
  }

  res.status(405).json({
    error: "method not allowed",
  });
}
