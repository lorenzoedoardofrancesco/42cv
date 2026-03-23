import collection from "lodash-es/collection";
import type { NextApiRequest, NextApiResponse } from "next";
import ReactDomServer from "react-dom/server";
import ProjectScore from "../../../../../components/badge/ProjectScore";
import {
  updateUserExtends42Data,
  UserNotFound,
  EXPIRE_TIME,
} from "../../../../../lib/updateUserExtends42Data";
import { FTAccountNotLinked } from "../../../../../lib/errors";

const GetHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId, projectId } = req.query as {
      userId: string;
      projectId: string;
    };

    const user = await updateUserExtends42Data({
      id: userId,
    });

    const accounts = collection.keyBy(user.accounts, "provider");
    if (!accounts["42-school"]) throw new FTAccountNotLinked();

    const projectsUsers = collection.keyBy(
      user.extended42Data.projects_users,
      "id"
    );

    if (process.env.NODE_ENV === "production") {
      const ExpiresDate = new Date();
      ExpiresDate.setSeconds(ExpiresDate.getSeconds() + EXPIRE_TIME);
      res.setHeader("Cache-Control", `public, s-maxage=${EXPIRE_TIME}, stale-while-revalidate=${EXPIRE_TIME * 2}`);
      res.setHeader("Expires", ExpiresDate.toISOString());
    }

    res.setHeader("Content-Type", "image/svg+xml");
    return res
      .status(200)
      .send(
        ReactDomServer.renderToStaticMarkup(
          <ProjectScore data={projectsUsers[projectId]} />
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
