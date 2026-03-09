import React, { useState, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
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
    <div>
      <div className="flex flex-col gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
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
    </div>
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

const FEEDBACK_TYPES = [
  { value: "bug", label: "🐛 Bug report" },
  { value: "feature", label: "✨ Feature request" },
  { value: "other", label: "💬 Other" },
] as const;

const FeedbackForm = ({ login }: { login: string }) => {
  const [type, setType] = useState<string>("feature");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    const labelMap: Record<string, string> = { bug: "bug", feature: "enhancement", other: "question" };
    const issueTitle = encodeURIComponent(`[${type}] ${title.trim()}`);
    const issueBody = encodeURIComponent(`**Submitted by:** @${login}\n\n${body.trim()}`);
    const label = labelMap[type] ?? "question";
    window.open(
      `https://github.com/lorenzoedoardofrancesco/42cv/issues/new?title=${issueTitle}&body=${issueBody}&labels=${label}`,
      "_blank"
    );
  };

  return (
    <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-3">
      <div className="flex gap-2">
        {FEEDBACK_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setType(value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              type === value
                ? "bg-neutral-700 border-neutral-500 text-white"
                : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Short title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
      />
      <textarea
        placeholder="Tell us more (optional)…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 resize-none"
      />
      <button
        onClick={submit}
        disabled={!title.trim()}
        className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
        Open GitHub issue
      </button>
    </div>
  );
};

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
  const [isPublicProfile, setIsPublicProfile] = useState((data as any).isPublicProfile ?? false);
  const [isDisplayOutstandingVotes, setIsDisplayOutstandingVotes] = useState((data as any).isDisplayOutstandingVotes ?? true);
  const [selectedAchievementIds, setSelectedAchievementIds] = useState<number[]>((data as any).selectedAchievementIds ?? []);
  const [githubUrl, setGithubUrl] = useState<string>((data as any).githubUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState<string>((data as any).linkedinUrl ?? "");
  const [address, setAddress] = useState<string>((data as any).address ?? "");
  const [phone, setPhone] = useState<string>((data as any).phone ?? "");
  const [defaultDarkMode, setDefaultDarkMode] = useState<boolean>((data as any).defaultDarkMode ?? false);
  const [isDisplayCampusCohortRank, setIsDisplayCampusCohortRank] = useState<boolean>((data as any).isDisplayCampusCohortRank ?? false);
  const [isDisplayCohortRank, setIsDisplayCohortRank] = useState<boolean>((data as any).isDisplayCohortRank ?? false);
  const [isDisplayAllTimeRank, setIsDisplayAllTimeRank] = useState<boolean>((data as any).isDisplayAllTimeRank ?? false);
  const [bio, setBio] = useState<string>((data as any).bio ?? "");
  const [projectGithubLinks, setProjectGithubLinks] = useState<Record<string, string>>(() => {
    const links: Record<string, string> = {};
    for (const link of ((data as any).projectGithubLinks ?? []) as { projectSlug: string; githubUrl: string }[]) {
      links[link.projectSlug] = link.githubUrl;
    }
    return links;
  });

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

  const statsUrl = `https://42cv.dev/api/badge/${data.id}/stats?cursusId=${cursusId}&coalitionId=${coalitionId}`;
  const projectUrl = `https://42cv.dev/api/badge/${data.id}/project`;

  const projectList = useMemo(
    () =>
      collection
        .filter(
          data.extended42Data.projects_users,
          (o) =>
            !o.project.parent_id &&
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
      <Head>
        <title>42cv.dev</title>
      </Head>
      {/* 42CV Hero + Section */}
      <section className="space-y-4">
        <div className="text-center pt-4">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-white">42cv</h1>
            <span className="px-2 py-0.5 text-xs font-bold tracking-widest uppercase rounded-full bg-green-500/20 text-green-400 border border-green-500/40 animate-pulse">
              New
            </span>
          </div>
          <p className="mt-2 text-neutral-500">
            A recruiter-friendly CV page - shareable in one link.
          </p>
        </div>
        <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-4">
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-neutral-200">Make profile public</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Anyone with the link can view your profile - no login required.
              </p>
            </div>
            <button
              onClick={async () => {
                const next = !isPublicProfile;
                setIsPublicProfile(next);
                await axios.patch("/api/v2/me", {
                  isDisplayEmail: isDisplayEmail ? "true" : "false",
                  isDisplayName: isDisplayName ? "true" : "false",
                  isPublicProfile: next ? "true" : "false",
                });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                isPublicProfile ? "bg-green-600" : "bg-neutral-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublicProfile ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
          {isPublicProfile && (
            <>
              {/* Bio */}
              <div>
                <p className="text-sm text-neutral-200 mb-1">Bio</p>
                <p className="text-xs text-neutral-500 mb-3">A short summary shown at the top of your CV. 2&ndash;3 sentences about who you are and what you&apos;re looking for.</p>
                <textarea
                  value={bio}
                  placeholder="e.g. Software engineer passionate about systems programming and open source. Looking for a backend role in a fast-paced environment."
                  onChange={(e) => setBio(e.target.value)}
                  onBlur={async () => {
                    await axios.patch("/api/v2/me", {
                      isDisplayEmail: isDisplayEmail ? "true" : "false",
                      isDisplayName: isDisplayName ? "true" : "false",
                      bio,
                    });
                  }}
                  rows={3}
                  maxLength={400}
                  className="w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 resize-none"
                />
                <p className="text-xs text-neutral-600 text-right mt-1">{bio.length}/400</p>
              </div>

              {/* Contact links */}
              <div>
                <p className="text-sm text-neutral-200 mb-1">Contact & Links</p>
                <p className="text-xs text-neutral-500 mb-3">Shown in the CV page header.</p>
                <div className="space-y-2">
                  {([
                    { label: "GitHub URL", value: githubUrl, set: setGithubUrl, key: "githubUrl", placeholder: "https://github.com/username" },
                    { label: "LinkedIn URL", value: linkedinUrl, set: setLinkedinUrl, key: "linkedinUrl", placeholder: "https://linkedin.com/in/username" },
                    { label: "Address", value: address, set: setAddress, key: "address", placeholder: "City, Country" },
                    { label: "Phone", value: phone, set: setPhone, key: "phone", placeholder: "+41 79 000 00 00" },
                  ] as const).map(({ label, value, set, key, placeholder }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-neutral-400 w-24 shrink-0">{label}</span>
                      <input
                        type="text"
                        value={value}
                        placeholder={placeholder}
                        onChange={(e) => set(e.target.value)}
                        onBlur={async () => {
                          await axios.patch("/api/v2/me", {
                            isDisplayEmail: isDisplayEmail ? "true" : "false",
                            isDisplayName: isDisplayName ? "true" : "false",
                            [key]: value,
                          });
                        }}
                        className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Default theme */}
              <label className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-neutral-200">Default CV theme</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Initial appearance for visitors who open your profile.
                  </p>
                </div>
                <div className="flex rounded-lg border border-neutral-700 overflow-hidden shrink-0">
                  {([
                    { value: false, icon: "☀️", label: "Light" },
                    { value: true,  icon: "🌙", label: "Dark"  },
                  ] as const).map(({ value, icon, label }) => (
                    <button
                      key={label}
                      onClick={async () => {
                        setDefaultDarkMode(value);
                        await axios.patch("/api/v2/me", {
                          isDisplayEmail: isDisplayEmail ? "true" : "false",
                          isDisplayName: isDisplayName ? "true" : "false",
                          defaultDarkMode: value ? "true" : "false",
                        });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                        defaultDarkMode === value
                          ? "bg-neutral-600 text-white"
                          : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </label>

              {/* Rankings */}
              <div>
                <p className="text-sm text-neutral-200 mb-1">Rankings</p>
                <p className="text-xs text-neutral-500 mb-3">Show your rank on your public profile. Computed weekly from the full 42 network via the 42 API.</p>
                <div className="space-y-3">
                  {([
                    { key: "isDisplayCampusCohortRank" as const, label: "Campus cohort rank", desc: `Your rank among ${primaryCampus?.name ?? "your campus"} students who joined in the same pool year.`, value: isDisplayCampusCohortRank, set: setIsDisplayCampusCohortRank },
                    { key: "isDisplayCohortRank" as const, label: "Cohort rank", desc: "Your rank among all 42 students who joined in the same pool year.", value: isDisplayCohortRank, set: setIsDisplayCohortRank },
                    { key: "isDisplayAllTimeRank" as const, label: "All-time rank", desc: "Your rank among all 42 students.", value: isDisplayAllTimeRank, set: setIsDisplayAllTimeRank },
                  ] as const).map(({ key, label, desc, value, set }) => (
                    <label key={key} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-neutral-200">{label}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={async () => {
                          const next = !value;
                          set(next);
                          await axios.patch("/api/v2/me", {
                            isDisplayEmail: isDisplayEmail ? "true" : "false",
                            isDisplayName: isDisplayName ? "true" : "false",
                            [key]: next ? "true" : "false",
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                          value ? "bg-green-600" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-neutral-200">Show outstanding votes</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Display star ratings on your validated projects.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const next = !isDisplayOutstandingVotes;
                    setIsDisplayOutstandingVotes(next);
                    await axios.patch("/api/v2/me", {
                      isDisplayEmail: isDisplayEmail ? "true" : "false",
                      isDisplayName: isDisplayName ? "true" : "false",
                      isDisplayOutstandingVotes: next ? "true" : "false",
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    isDisplayOutstandingVotes ? "bg-green-600" : "bg-neutral-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDisplayOutstandingVotes ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>

              {/* Project GitHub links */}
              <div>
                <p className="text-sm text-neutral-200 mb-1">Project GitHub Links</p>
                <p className="text-xs text-neutral-500 mb-3">Optionally link each project to its GitHub repo. Recruiters will see a clickable GitHub icon on your CV.</p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {projectList.map((project) => {
                    const slug = project.project.slug;
                    const currentUrl = projectGithubLinks[slug] ?? "";
                    return (
                      <div key={project.id} className="flex items-center gap-3">
                        <span className="text-xs text-neutral-400 w-36 shrink-0 truncate" title={project.project.name}>{project.project.name}</span>
                        <input
                          type="text"
                          value={currentUrl}
                          placeholder="https://github.com/user/repo"
                          onChange={(e) => {
                            setProjectGithubLinks((prev) => ({ ...prev, [slug]: e.target.value }));
                          }}
                          onBlur={async () => {
                            const val = currentUrl.trim();
                            if (val) {
                              await axios.put("/api/v2/project-github-links", { projectSlug: slug, githubUrl: val });
                              setProjectGithubLinks((prev) => ({ ...prev, [slug]: val }));
                            } else {
                              await axios.delete("/api/v2/project-github-links", { data: { projectSlug: slug } });
                              setProjectGithubLinks((prev) => {
                                const next = { ...prev };
                                delete next[slug];
                                return next;
                              });
                            }
                          }}
                          className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Achievements selection */}
              {(data.extended42Data.achievements ?? []).length > 0 && (
                <div>
                  <p className="text-sm text-neutral-200 mb-1">Achievements on CV</p>
                  <p className="text-xs text-neutral-500 mb-3">Select which achievements to display on your public profile.</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {(data.extended42Data.achievements as any[])
                      .filter((a) => a.visible !== false)
                      .map((a) => {
                        const checked = selectedAchievementIds.includes(a.id);
                        return (
                          <label key={a.id} className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={async () => {
                                const next = checked
                                  ? selectedAchievementIds.filter((id) => id !== a.id)
                                  : [...selectedAchievementIds, a.id];
                                setSelectedAchievementIds(next);
                                await axios.patch("/api/v2/me", {
                                  isDisplayEmail: isDisplayEmail ? "true" : "false",
                                  isDisplayName: isDisplayName ? "true" : "false",
                                  selectedAchievementIds: next,
                                });
                              }}
                              className="mt-0.5 accent-green-500 shrink-0"
                            />
                            <div>
                              <p className="text-xs font-medium text-neutral-300 group-hover:text-white transition-colors">{a.name}</p>
                              <p className="text-xs text-neutral-500">{a.description}</p>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Your CV link</span>
                <Code code={`https://42cv.dev/${data.extended42Data.login}`} />
              </div>
            </>
          )}
        </div>
      </section>

      <div className="border-t-2 border-neutral-800 my-4" />

      {/* Stats Card Section */}
      <section className="space-y-4">
        <div className="text-center pt-4">
          <h2 className="text-4xl font-bold tracking-tight text-white">42cv Badge</h2>
          <p className="mt-2 text-neutral-500">
            Dynamically generated badges for your git readmes.
          </p>
        </div>

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
                        !p.project.parent_id &&
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
              code={`[![${data.extended42Data.login}'s 42 stats](${statsUrl})](${isPublicProfile ? `https://42cv.dev/${data.extended42Data.login}` : "https://42cv.dev"})`}
            />
          </label>
          <label>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">HTML</span>
            <Code
              code={`<a href="${isPublicProfile ? `https://42cv.dev/${data.extended42Data.login}` : "https://42cv.dev"}"><img src="${statsUrl}" alt="${data.extended42Data.login}'s 42 stats" /></a>`}
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
                <span className="flex-1 text-sm font-medium text-neutral-300 group-open:text-white">
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

      <div className="border-t-2 border-neutral-800 my-4" />

      {/* Feedback Section */}
      <section className="space-y-4">
        <div className="text-center pt-4">
          <h2 className="text-4xl font-bold tracking-tight text-white">Feedback</h2>
          <p className="mt-2 text-neutral-500">
            Found a bug or have an idea? Submit it directly as a GitHub issue - takes 10 seconds.
          </p>
        </div>
        <FeedbackForm login={data.extended42Data.login} />
      </section>
    </Layout>
  );
};

export default withAuth(Home, {
  required42account: true,
});
