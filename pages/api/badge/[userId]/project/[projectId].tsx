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
      res.setHeader("Cache-Control", `public, max-age=${EXPIRE_TIME}`);
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
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    if (error instanceof UserNotFound) {
      return res.status(401).json({
        message: error.message,
      });
    }
    if (error instanceof FTAccountNotLinked) {
      return res.status(403).json({
        message: error.message,
      });
    }
    throw error;
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
