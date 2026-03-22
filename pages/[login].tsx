import { GetServerSideProps } from "next";
import { getToken } from "next-auth/jwt";
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import prisma from "../db";
import collection from "lodash-es/collection";
import { getBase64ImageFromUrl } from "../lib/getBase64ImageFromUrl";
import { WorkExperience, isDisplayable } from "../lib/workExperiences";
import { PublicProfile, Project, TeamStat, Rankings } from "../components/cv/Types";
import { tokens, levelDisplay } from "../components/cv/Theme";
import { CvHeader } from "../components/cv/CvHeader";
import { CvOverview } from "../components/cv/CvOverview";
import { CvJourney } from "../components/cv/CvJourney";

export default function CVPage({
  profile,
  initialDescriptions,
  correctionNumbers,
  teamStats: initialTeamStats,
  uncachedTeamIds,
  showOutstandingVotes,
  defaultDarkMode,
  rankings,
  isViewer42,
  isDisplayJourney,
}: {
  profile: PublicProfile;
  initialDescriptions: Record<string, string | null>;
  correctionNumbers: Record<string, number | null>;
  teamStats: Record<number, TeamStat>;
  uncachedTeamIds: number[];
  showOutstandingVotes: boolean;
  defaultDarkMode: boolean;
  rankings: Rankings | null;
  isViewer42: boolean;
  isDisplayJourney: boolean;
}) {
  const { query } = useRouter();
  const isPreview = query.preview === "1";

  const [dark, setDark] = useState(defaultDarkMode);
  const t = tokens(dark);
  const accent = t.accent;

  useEffect(() => {
    const saved = localStorage.getItem("cv_theme");
    if (saved) setDark(saved === "dark");
  }, []);
  const toggleTheme = () => {
    setDark((d) => {
      localStorage.setItem("cv_theme", d ? "light" : "dark");
      return !d;
    });
  };

  const hasOverview = profile.workExperiences.length > 0 || profile.featuredProjectIds.length > 0 || profile.credlyBadges.length > 0;
  const showJourneyTab = hasOverview && isDisplayJourney;
  const [view, setView] = useState<"overview" | "full">(hasOverview ? "overview" : "full");

  const mainCursus =
    profile.cursusUsers.find((c) => !c.cursus.slug.includes("piscine")) ??
    profile.cursusUsers[profile.cursusUsers.length - 1];

  const [skillView, setSkillView] = useState<"bars" | "radar">("bars");
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const [projectDescriptions, setProjectDescriptions] = useState<Record<string, string | null | "loading">>(initialDescriptions);
  const [teamStats, setTeamStats] = useState<Record<number, TeamStat>>(initialTeamStats);

  useEffect(() => {
    if (uncachedTeamIds.length === 0) return;
    fetch("/api/team-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamIds: uncachedTeamIds }),
    })
      .then((r) => r.json())
      .then((data: Record<number, TeamStat>) =>
        setTeamStats((prev) => ({ ...prev, ...data }))
      )
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleProject = (project: Project) => {
    if (expandedProjectId === project.id) {
      setExpandedProjectId(null);
      return;
    }
    setExpandedProjectId(project.id);
    if (!(project.slug in projectDescriptions)) {
      setProjectDescriptions((prev) => ({ ...prev, [project.slug]: "loading" }));
      fetch(`/api/project-description/${project.slug}`)
        .then((r) => r.json())
        .then(({ description }) =>
          setProjectDescriptions((prev) => ({ ...prev, [project.slug]: description }))
        )
        .catch(() =>
          setProjectDescriptions((prev) => ({ ...prev, [project.slug]: null }))
        );
    }
  };

  const { pct: lvlPct } = levelDisplay(mainCursus?.level ?? 0);

  const validatedProjects = profile.projects
    .filter((p) => p.validated && !p.parentId && p.cursusIds.includes(mainCursus?.cursus.id ?? 0))
    .sort((a, b) => new Date(b.markedAt ?? 0).getTime() - new Date(a.markedAt ?? 0).getTime());

  const skills = [...(mainCursus?.skills ?? [])]
    .sort((a, b) => b.level - a.level)
    .slice(0, 16);

  const outstandingTotal = validatedProjects.reduce((sum, p) => {
    const stat = p.teamId ? teamStats[p.teamId] : null;
    return sum + (stat?.outstandingCount ?? 0);
  }, 0);

  const featuredProjects = useMemo(() => {
    const projectMap = new Map(profile.projects.map((p) => [p.id, p]));
    return profile.featuredProjectIds
      .map((id) => projectMap.get(id))
      .filter((p): p is Project => !!p);
  }, [profile.featuredProjectIds, profile.projects]);

  const [lvlBarWidth, setLvlBarWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setLvlBarWidth(lvlPct), 120);
    return () => clearTimeout(timer);
  }, [lvlPct]);

  const title = `${profile.displayname ?? profile.login} - 42 Profile`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`42 student at ${profile.campus} - level ${Math.floor(mainCursus?.level ?? 0)}, ${validatedProjects.length} validated projects.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://42cv.dev/${profile.login}`} />
        <meta property="og:site_name" content="42cv.dev" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={`Level ${Math.floor(mainCursus?.level ?? 0)} · ${mainCursus?.grade ?? "Student"} · ${profile.campus}`} />
        <meta property="og:image" content={`https://42cv.dev/api/og/${profile.login}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`https://42cv.dev/api/og/${profile.login}`} />
        {isPreview && <meta name="robots" content="noindex" />}

        <style>{`
          @font-face { font-family: 'HelveticaNeue'; src: url('/assets/fonts/helvetica-neue/HelveticaNeueLight.otf') format('opentype'); font-weight: 300; font-style: normal; }
          @font-face { font-family: 'HelveticaNeue'; src: url('/assets/fonts/helvetica-neue/HelveticaNeueRoman.otf') format('opentype'); font-weight: 400; font-style: normal; }
          @font-face { font-family: 'HelveticaNeue'; src: url('/assets/fonts/helvetica-neue/HelveticaNeueMedium.otf') format('opentype'); font-weight: 500; font-style: normal; }
          @font-face { font-family: 'HelveticaNeue'; src: url('/assets/fonts/helvetica-neue/HelveticaNeueBold.otf') format('opentype'); font-weight: 700; font-style: normal; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-break-inside-avoid { break-inside: avoid; }
            * { transition: none !important; animation: none !important; }
            .print-single-col { display: block !important; }
            .print-single-col > * { width: 100% !important; max-width: 100% !important; }
            .print-order-1 { order: 1 !important; }
            .print-order-2 { order: 2 !important; }
            .print-order-3 { order: 3 !important; }
            .print-mb { margin-bottom: 1.5rem !important; }
            .print-grid-2col { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 1rem !important; }
            [style*="opacity"] { opacity: 1 !important; transform: none !important; }
            header { padding-bottom: 0.5rem !important; }
            main { padding-top: 1rem !important; padding-bottom: 0 !important; }
            .min-h-screen { min-height: auto !important; }
            main > div { gap: 1rem !important; }
            .print-break-inside-avoid { break-inside: avoid; }
            .print-project-row { break-inside: avoid; }
            .print-year-gap > * + * { margin-top: 1rem !important; }
          }
        `}</style>
      </Head>

      <div
        className={isPreview
          ? "flex flex-col items-center justify-center transition-colors duration-300"
          : "min-h-screen transition-colors duration-300 [overflow-x:clip]"}
        style={{
          backgroundColor: t.bg,
          color: t.text,
          fontFamily: "'HelveticaNeue', sans-serif",
          ...(isPreview ? { height: 630, width: 1200 } : {}),
        }}
      >
        <CvHeader
          profile={profile}
          activeCursus={mainCursus}
          accent={accent}
          t={t}
          dark={dark}
          toggleTheme={toggleTheme}
          skillView={skillView}
          setSkillView={setSkillView}
          validatedProjectCount={validatedProjects.length}
          outstandingTotal={outstandingTotal}
          showOutstandingVotes={showOutstandingVotes}
          rankings={rankings}
          lvlBarWidth={lvlBarWidth}
          showJourneyTab={isPreview ? false : showJourneyTab}
          view={view}
          setView={setView}
          hideControls={isPreview}
        />

        {!isPreview && (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
            {(view === "overview" || !isDisplayJourney) && hasOverview ? (
              <CvOverview
                profile={profile}
                featuredProjects={featuredProjects}
                accent={accent}
                t={t}
                showOutstandingVotes={showOutstandingVotes}
                correctionNumbers={correctionNumbers}
                teamStats={teamStats}
                projectDescriptions={projectDescriptions}
                isViewer42={isViewer42}
              />
            ) : (
              <CvJourney
                profile={profile}
                validatedProjects={validatedProjects}
                skills={skills}
                skillView={skillView}
                setSkillView={setSkillView}
                accent={accent}
                t={t}
                showOutstandingVotes={showOutstandingVotes}
                correctionNumbers={correctionNumbers}
                teamStats={teamStats}
                projectDescriptions={projectDescriptions}
                expandedProjectId={expandedProjectId}
                toggleProject={toggleProject}
                isViewer42={isViewer42}
              />
            )}
          </main>
        )}

        <footer className={`max-w-6xl mx-auto px-4 sm:px-6 py-6 flex justify-center border-t${isPreview ? "" : " no-print"}`} style={{ borderColor: t.hrColor }}>
          <Link href="/" className="text-xs transition-colors hover:opacity-80" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
            powered by 42cv.dev
          </Link>
        </footer>
      </div>
    </>
  );
}

const JUNK_PATHS = new Set([
  "wp-login.php", "wp-admin", "xmlrpc.php", ".env", "admin",
  "wp-includes", "wp-content", ".git", "config.php",
]);

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const login = params?.login as string;

  if (!login || JUNK_PATHS.has(login) || login.includes(".")) {
    return { notFound: true };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        ftSchoolVerified: true,
        extended42Data: { path: ["login"], equals: login },
      } as any,
    });

    if (!user || !(user as any).isPublicProfile || !user.extended42Data) {
      return { notFound: true };
    }

    const data = user.extended42Data as any;

    const primaryCampus =
      collection.find(
        data.campus,
        (campus: any) =>
          campus.id ===
          (
            collection.find(data.campus_users, (cu: any) => cu.is_primary) ??
            data.campus_users[0]
          )?.campus_id
      ) ?? data.campus[0];

    const photoMode = (user as any).photoMode ?? "none";
    let profileImage: string | null = null;
    if (photoMode === "custom" && (user as any).customPhotoUrl) {
      profileImage = (user as any).customPhotoUrl;
    } else if (photoMode === "42campus") {
      const profileImageUrl = data.image?.versions?.medium || data.image?.link || data.image_url;
      profileImage = profileImageUrl
        ? await getBase64ImageFromUrl(encodeURI(profileImageUrl)).catch(() => null)
        : null;
    }

    const profile: PublicProfile = {
      login: data.login,
      displayname: user.isDisplayName ? (
        data.first_name && data.last_name
          ? `${data.first_name} ${data.last_name}`
          : data.usual_full_name || data.displayname
      ) : null,
      email: user.isDisplayEmail ? data.email : null,
      profileImage,
      campus: `42${primaryCampus?.name ?? ""}`,
      campusCountry: primaryCampus?.country ?? null,
      poolMonth: data.pool_month ?? "",
      poolYear: data.pool_year ?? "",
      cursusUsers: (data.cursus_users ?? []).map((cu: any) => ({
        cursus: { id: cu.cursus_id, name: cu.cursus.name, slug: cu.cursus.slug },
        level: cu.level,
        grade: cu.grade ?? null,
        begin_at: cu.begin_at,
        end_at: cu.end_at ?? null,
        blackholed_at: cu.blackholed_at ?? null,
        skills: cu.skills ?? [],
      })),
      projects: (data.projects_users ?? []).map((p: any) => ({
        id: p.id,
        name: p.project.name,
        slug: p.project.slug,
        parentId: p.project.parent_id ?? null,
        finalMark: p.final_mark ?? null,
        validated: p["validated?"] ?? false,
        cursusIds: p.cursus_ids,
        markedAt: p.marked_at ?? null,
        teamId: p.current_team_id ?? null,
      })),
      githubUrl: (user as any).githubUrl ?? null,
      linkedinUrl: (user as any).linkedinUrl ?? null,
      websiteUrl: (user as any).websiteUrl ?? null,
      address: (user as any).address ?? null,
      phone: (user as any).phone ?? null,
      bio: (user as any).bio ?? null,
      projectGithubLinks: {},
      projectDescriptionOverrides: (user as any).projectDescriptionOverrides ?? {},
      workExperiences: [],
      credlyBadges: ((user as any).credlyBadges as { id: string; label?: string }[]) ?? [],
      featuredProjectIds: (user as any).featuredProjectIds ?? [],
      skillTags: ((user as any).skillTags as any[] ?? []).map((t: any) => ({
        category: t.category,
        items: Array.isArray(t.items) ? t.items : typeof t.items === "string" ? t.items.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      })),
      achievements: (() => {
        const selectedIds: number[] = (user as any).selectedAchievementIds ?? [];
        if (selectedIds.length === 0) return [];
        return (data.achievements ?? [])
          .filter((a: any) => selectedIds.includes(a.id))
          .map((a: any) => ({ id: a.id, name: a.name, description: a.description, tier: a.tier, kind: a.kind }));
      })(),
    };

    const githubLinks = await prisma.projectGithubLink.findMany({
      where: { userId: user.id },
      select: { projectSlug: true, githubUrl: true },
    });
    for (const link of githubLinks) {
      profile.projectGithubLinks[link.projectSlug] = link.githubUrl;
    }

    const workExps = await (prisma as any).workExperience.findMany({
      where: { userId: user.id },
      orderBy: [{ order: "asc" }, { startDate: "desc" }],
    });
    profile.workExperiences = workExps.filter((e: WorkExperience) => isDisplayable(e));

    const projectSlugs = (data.projects_users ?? [])
      .filter((p: any) => p["validated?"] && !p.project.parent_id)
      .map((p: any) => p.project.slug as string);

    const cachedDescriptions = await (prisma as any).projectDescription.findMany({
      where: { slug: { in: projectSlugs } },
      select: { slug: true, description: true, correctionNumber: true },
    });

    const initialDescriptions: Record<string, string | null> = {};
    const correctionNumbers: Record<string, number | null> = {};
    for (const row of cachedDescriptions) {
      initialDescriptions[row.slug] = row.description;
      correctionNumbers[row.slug] = row.correctionNumber ?? null;
    }

    const validatedTeamIds = (data.projects_users ?? [])
      .filter((p: any) => p["validated?"] && !p.project.parent_id && p.current_team_id)
      .map((p: any) => p.current_team_id as number);

    const cachedStats = await (prisma as any).teamStat.findMany({
      where: { teamId: { in: validatedTeamIds } },
    });
    const statMap: Record<number, { totalEvals: number; outstandingCount: number }> = {};
    const TEAM_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
    const freshIds = new Set<number>();
    const now = Date.now();

    for (const s of cachedStats) {
      statMap[s.teamId] = { totalEvals: s.totalEvals, outstandingCount: s.outstandingCount };
      if (now - new Date(s.checkedAt).getTime() < TEAM_CACHE_TTL) {
        freshIds.add(s.teamId);
      }
    }

    const uncachedTeamIds = validatedTeamIds.filter((id: number) => !freshIds.has(id));

    const showOutstandingVotes = (user as any).isDisplayOutstandingVotes ?? true;
    const defaultDarkMode = (user as any).defaultDarkMode ?? false;
    const isDisplayJourney = (user as any).isDisplayJourney ?? true;

    const showAllTimeRank = (user as any).isDisplayAllTimeRank ?? false;
    const showCohortRank = (user as any).isDisplayCohortRank ?? false;
    const showCampusCohortRank = (user as any).isDisplayCampusCohortRank ?? false;

    let rankings: Rankings | null = null;
    if (showAllTimeRank || showCohortRank || showCampusCohortRank) {
      const cached = await (prisma as any).rankingCache.findUnique({
        where: { login: profile.login },
      });
      if (cached) {
        rankings = {
          ...(showAllTimeRank && cached.allTimeRank != null && {
            allTime: { rank: cached.allTimeRank, total: cached.allTimeTotal },
          }),
          ...(showCohortRank && cached.cohortRank != null && {
            cohort: { rank: cached.cohortRank, total: cached.cohortTotal },
          }),
          ...(showCampusCohortRank && cached.campusCohortRank != null && {
            campusCohort: { rank: cached.campusCohortRank, total: cached.campusCohortTotal },
          }),
        };
      }
    }

    const token = await getToken({ req });
    const isViewer42 = !!token;

    return { props: { profile, initialDescriptions, correctionNumbers, teamStats: statMap, uncachedTeamIds, showOutstandingVotes, defaultDarkMode, rankings, isViewer42, isDisplayJourney } };
  } catch (e) {
    console.error(e);
    return { notFound: true };
  }
};
