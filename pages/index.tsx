import React, { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "../components/Layout";
import Stats, { StatsProps } from "../components/badge/Stats";
import Code from "../components/Code";
import collection from "lodash-es/collection";
import { AuthContext, withAuth } from "../lib/auth/AuthProvider";
import { useContext } from "react";
import axios from "axios";
import getCoalitions from "../lib/getCoalitions";
import ProjectScore from "../components/badge/ProjectScore";

const StatsWrapper = ({ data }: StatsProps) => {
  const [isShow, setIsShow] = useState(false);

  useEffect(() => {
    setIsShow(false);
    const timer = setTimeout(() => {
      setIsShow(true);
    });

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...Object.values(data)]);

  return (
    <div style={{ width: "500px" }}>
      {isShow && <Stats data={data} />}
    </div>
  );
};

type StatsOptionsProps = {
  isDisplayName: boolean;
  isDisplayEmail: boolean;
  isDisplayPhoto: boolean;
  isDisplayProjectCount: boolean;
  setIsDisplayName: (value: boolean) => void;
  setIsDisplayEmail: (value: boolean) => void;
  setIsDisplayPhoto: (value: boolean) => void;
  setIsDisplayProjectCount: (value: boolean) => void;
};

const StatsOptions = ({
  isDisplayEmail,
  isDisplayName,
  isDisplayPhoto,
  isDisplayProjectCount,
  setIsDisplayEmail,
  setIsDisplayName,
  setIsDisplayPhoto,
  setIsDisplayProjectCount,
}: StatsOptionsProps) => {
  const [isFetching, setIsFetching] = useState(false);
  const updateOption = useCallback(async () => {
    setIsFetching(true);
    try {
      await axios.patch("/api/v2/me", {
        isDisplayEmail: isDisplayEmail ? "true" : "false",
        isDisplayName: isDisplayName ? "true" : "false",
        isDisplayPhoto: isDisplayPhoto ? "true" : "false",
        isDisplayProjectCount: isDisplayProjectCount ? "true" : "false",
      });
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response) {
        alert(error.response.data.message);
      } else if (error instanceof Error) {
        alert(error.message);
      }
    }
    setIsFetching(false);
  }, [isDisplayEmail, isDisplayName, isDisplayPhoto, isDisplayProjectCount]);

  return (
    <details className="group">
      <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
        Advanced Options
      </summary>
      <div className="flex flex-col gap-3 mt-3 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
        <p className="border border-amber-800/50 bg-amber-950/30 text-amber-200/80 rounded-lg p-3 text-sm">
          Changes may take up to 12 hours due to browser and CDN cache.
        </p>
        <label className="flex items-center gap-3">
          <span className="text-sm text-neutral-400 w-28">Display Name</span>
          <select
            className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 appearance-none focus:outline-none focus:border-neutral-500"
            value={isDisplayName ? "true" : "false"}
            onChange={(option) =>
              setIsDisplayName(option.target.value === "true")
            }
          >
            <option value={"true"}>Yes</option>
            <option value={"false"}>No</option>
          </select>
        </label>
        <label className="flex items-center gap-3">
          <span className="text-sm text-neutral-400 w-28">Display Email</span>
          <select
            className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 appearance-none focus:outline-none focus:border-neutral-500"
            value={isDisplayEmail ? "true" : "false"}
            onChange={(option) =>
              setIsDisplayEmail(option.target.value === "true")
            }
          >
            <option value={"true"}>Yes</option>
            <option value={"false"}>No</option>
          </select>
        </label>
        <label className="flex items-center gap-3">
          <span className="text-sm text-neutral-400 w-28">Display Photo</span>
          <select
            className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 appearance-none focus:outline-none focus:border-neutral-500"
            value={isDisplayPhoto ? "true" : "false"}
            onChange={(option) =>
              setIsDisplayPhoto(option.target.value === "true")
            }
          >
            <option value={"true"}>Yes</option>
            <option value={"false"}>No</option>
          </select>
        </label>
        <label className="flex items-center gap-3">
          <span className="text-sm text-neutral-400 w-28">Projects</span>
          <select
            className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 appearance-none focus:outline-none focus:border-neutral-500"
            value={isDisplayProjectCount ? "true" : "false"}
            onChange={(option) =>
              setIsDisplayProjectCount(option.target.value === "true")
            }
          >
            <option value={"true"}>Yes</option>
            <option value={"false"}>No</option>
          </select>
        </label>
        <button
          className="text-sm px-4 py-1.5 border border-neutral-700 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isFetching}
          onClick={updateOption}
        >
          {isFetching ? "Saving..." : "Save"}
        </button>
      </div>
    </details>
  );
};

const SelectField = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <label className="flex items-center gap-3">
    <span className="text-sm text-neutral-400 w-28 shrink-0">{label}</span>
    <select
      className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 appearance-none focus:outline-none focus:border-neutral-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  </label>
);

const Home = () => {
  const { data } = useContext(AuthContext);

  const [cursusId, setCursusId] = useState(
    data.extended42Data.cursus_users[
      data.extended42Data.cursus_users.length - 1
    ].cursus_id.toString()
  );
  const cursus_users = collection.keyBy(
    data.extended42Data.cursus_users,
    "cursus_id"
  );

  const selectedCursus =
    cursus_users[cursusId] ?? data.extended42Data.cursus_users[0];

  const [coalitionId, setCoalitionId] = useState(
    data.extended42Data.coalitions.length
      ? data.extended42Data.coalitions[
          data.extended42Data.coalitions.length - 1
        ].id.toString()
      : "undefined"
  );

  const [isDisplayName, setIsDisplayName] = useState(data.isDisplayName);
  const [isDisplayEmail, setIsDisplayEmail] = useState(data.isDisplayEmail);
  const [isDisplayPhoto, setIsDisplayPhoto] = useState(data.isDisplayPhoto);
  const [isDisplayProjectCount, setIsDisplayProjectCount] = useState((data as any).isDisplayProjectCount ?? true);

  const coalition = useMemo(
    () => getCoalitions(coalitionId, data.extended42Data.coalitions),
    [coalitionId, data.extended42Data.coalitions]
  );

  useEffect(() => {
    if (
      data.extended42Data.coalitions.length &&
      selectedCursus.cursus.slug.includes("piscine")
    ) {
      setCoalitionId("piscine");
    }
  }, [selectedCursus, data.extended42Data.coalitions.length]);

  const statsUrl = `https://42badge.vercel.app/api/v2/${data.id}/stats?cursusId=${cursusId}&coalitionId=${coalitionId}`;
  const projectUrl = `https://42badge.vercel.app/api/v2/${data.id}/project`;

  const projectList = useMemo(
    () =>
      collection
        .filter(data.extended42Data.projects_users, (o) =>
          o.cursus_ids.includes(parseInt(cursusId))
        )
        .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)),
    [cursusId, data.extended42Data.projects_users]
  );

  const primaryCampus =
    collection.find(
      data.extended42Data.campus,
      (campus) =>
        campus.id ===
        (
          collection.find(
            data.extended42Data.campus_users,
            (campus_user) => campus_user.is_primary
          ) ?? data.extended42Data.campus_users[0]
        ).campus_id
    ) ?? data.extended42Data.campus[0];

  return (
    <Layout>
      {/* Hero */}
      <div className="text-center pt-4">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          42Badge
        </h1>
        <p className="mt-2 text-neutral-500">
          Dynamically generated 42 badges for your git readmes.
        </p>
      </div>

      {/* Stats Card Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Stats Card</h2>
        <p className="text-sm text-neutral-500">
          Copy-paste the URL into your markdown and that&apos;s it.
        </p>

        {/* Preview */}
        <div className="flex justify-center">
          <div className="overflow-x-auto max-w-full">
            <StatsWrapper
              data={{
                login: data.extended42Data.login,
                name: isDisplayName && data.extended42Data.displayname,
                campus: `42${primaryCampus.name}`,
                begin_at: selectedCursus.begin_at,
                end_at: selectedCursus.end_at,
                blackholed_at: selectedCursus.blackholed_at,
                cursus: selectedCursus.cursus.name,
                grade: selectedCursus.grade ?? "Pisciner",
                color: coalition.color,
                email: isDisplayEmail && data.extended42Data.email,
                level: selectedCursus.level,
                profileImage: isDisplayPhoto
                  ? data.extended42Data.image?.versions?.medium ||
                    data.extended42Data.image?.link
                  : null,
                projectCount: isDisplayProjectCount
                  ? data.extended42Data.projects_users.filter(
                      (p) =>
                        p["validated?"] === true &&
                        p.cursus_ids.includes(parseInt(cursusId))
                    ).length
                  : null,
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg">
          <SelectField label="Cursus" value={cursusId} onChange={setCursusId}>
            {data.extended42Data.cursus_users.map((cursus_user) => (
              <option key={cursus_user.cursus_id} value={cursus_user.cursus_id}>
                {cursus_user.cursus.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Design" value={coalitionId} onChange={setCoalitionId}>
            <option value={"piscine"}>Piscine</option>
            {data.extended42Data.coalitions.map((colation) => (
              <option key={colation.id} value={colation.id}>
                {colation.name}
              </option>
            ))}
            <option value={"undefined"}>Neutral</option>
            <option value={"midnight"}>Midnight</option>
            <option value={"carbon"}>Carbon</option>
            <option value={"rose"}>Rose</option>
            <option value={"neon"}>Neon</option>
            {selectedCursus.level >= 21 && (
              <option value={"level21"}>Gold | Level 21</option>
            )}
          </SelectField>
        </div>

        <StatsOptions
          isDisplayEmail={isDisplayEmail}
          isDisplayName={isDisplayName}
          isDisplayPhoto={isDisplayPhoto}
          isDisplayProjectCount={isDisplayProjectCount}
          setIsDisplayEmail={setIsDisplayEmail}
          setIsDisplayName={setIsDisplayName}
          setIsDisplayPhoto={setIsDisplayPhoto}
          setIsDisplayProjectCount={setIsDisplayProjectCount}
        />

        {/* Code snippets */}
        <div className="space-y-2">
          <label>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">URL</span>
            <Code code={statsUrl} />
          </label>
          <label>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Markdown</span>
            <Code
              code={`[![${data.extended42Data.login}'s 42 stats](${statsUrl})](https://42badge.vercel.app)`}
            />
          </label>
          <label>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">HTML</span>
            <Code
              code={`<a href="https://42badge.vercel.app"><img src="${statsUrl}" alt="${data.extended42Data.login}'s 42 stats" /></a>`}
            />
          </label>
        </div>
      </section>

      <hr className="border-neutral-800" />

      {/* Project Score Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Project Scores</h2>
        <p className="text-sm text-neutral-500">
          Badge for each project. Copy the markdown into your readme.
        </p>

        <div className="space-y-1">
          {projectList.map((project) => (
            <details key={project.id} className="group">
              <summary className="cursor-pointer flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-neutral-900 transition-colors">
                <span className="text-sm font-medium text-neutral-300 group-open:text-white">
                  {project.project.name}
                </span>
                <ProjectScore data={project} />
              </summary>
              <div className="space-y-2 pl-3 pb-3">
                <label>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">URL</span>
                  <Code code={`${projectUrl}/${project.id}`} />
                </label>
                <label>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Markdown</span>
                  <Code
                    code={`[![${data.extended42Data.login}'s 42 ${project.project.name} Score](${projectUrl}/${project.id})](https://projects.intra.42.fr/projects/${project.project.slug}/projects_users/${project.id})`}
                  />
                </label>
                <label>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">HTML</span>
                  <Code
                    code={`<a href="https://projects.intra.42.fr/projects/${project.project.slug}/projects_users/${project.id}"><img src="${projectUrl}/${project.id}" alt="${data.extended42Data.login}'s 42 ${project.project.name} Score" /></a>`}
                  />
                </label>
              </div>
            </details>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default withAuth(Home, {
  required42account: true,
});
