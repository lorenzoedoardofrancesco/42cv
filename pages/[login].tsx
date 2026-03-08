import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import prisma from "../db";
import collection from "lodash-es/collection";
import { getBase64ImageFromUrl } from "../lib/getBase64ImageFromUrl";

// ─── Types ────────────────────────────────────────────────────────────────────

type Skill = { name: string; level: number };

type Project = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  finalMark: number | null;
  validated: boolean;
  cursusIds: number[];
  markedAt: string | null;
  teamId: number | null;
};

type TeamStat = { totalEvals: number; outstandingCount: number };

type Achievement = {
  id: number;
  name: string;
  description: string;
  tier: string;
  kind: string;
};


type CursusEntry = {
  cursus: { id: number; name: string; slug: string };
  level: number;
  grade: string | null;
  begin_at: string;
  end_at: string | null;
  blackholed_at: string | null;
  skills: Skill[];
};

type PublicProfile = {
  login: string;
  displayname: string | null;
  profileImage: string | null;
  email: string | null;
  campus: string;
  campusCountry: string | null;
  poolMonth: string;
  poolYear: string;
  cursusUsers: CursusEntry[];
  projects: Project[];
  achievements: Achievement[];
  githubUrl: string | null;
  linkedinUrl: string | null;
  address: string | null;
  phone: string | null;
  bio: string | null;
  projectGithubLinks: Record<string, string>;
};

type Rankings = {
  campusCohort?: { rank: number; total: number };
  cohort?: { rank: number; total: number };
  allTime?: { rank: number; total: number };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countryToFlag(country: string | null): string | null {
  if (!country) return null;
  const COUNTRY_CODES: Record<string, string> = {
    "france": "FR", "italy": "IT", "switzerland": "CH", "germany": "DE",
    "spain": "ES", "portugal": "PT", "netherlands": "NL", "belgium": "BE",
    "austria": "AT", "united kingdom": "GB", "uk": "GB", "ireland": "IE",
    "finland": "FI", "sweden": "SE", "norway": "NO", "denmark": "DK",
    "poland": "PL", "czech republic": "CZ", "czechia": "CZ", "romania": "RO",
    "turkey": "TR", "russia": "RU", "ukraine": "UA",
    "united states": "US", "usa": "US", "canada": "CA", "mexico": "MX",
    "brazil": "BR", "argentina": "AR", "chile": "CL", "colombia": "CO",
    "peru": "PE", "uruguay": "UY",
    "japan": "JP", "south korea": "KR", "korea": "KR",
    "thailand": "TH", "malaysia": "MY", "singapore": "SG", "india": "IN",
    "indonesia": "ID", "philippines": "PH",
    "australia": "AU", "new zealand": "NZ",
    "south africa": "ZA", "morocco": "MA", "egypt": "EG", "tunisia": "TN",
    "nigeria": "NG", "senegal": "SN", "madagascar": "MG",
    "united arab emirates": "AE", "uae": "AE", "saudi arabia": "SA",
    "jordan": "JO", "lebanon": "LB", "palestine": "PS", "israel": "IL",
    "armenia": "AM", "georgia": "GE", "luxembourg": "LU",
    "taiwan": "TW", "china": "CN", "hong kong": "HK",
  };
  const code = COUNTRY_CODES[country.toLowerCase()];
  if (!code) return null;
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

type ScoreTier = "green" | "amber" | "fail";

function scoreTier(mark: number | null, validated: boolean): ScoreTier {
  if (!validated || mark === null) return "fail";
  if (mark >= 80) return "green";
  if (mark >= 50) return "amber";
  return "fail";
}

const TIER_COLORS: Record<ScoreTier, { color: string; bg: string; border: string }> = {
  green: { color: "#16a34a", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.30)"  },
  amber: { color: "#ea580c", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.30)" },
  fail:  { color: "#dc2626", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.30)"  },
};

const TIER_COLORS_DARK: Record<ScoreTier, { color: string; bg: string; border: string }> = {
  green: { color: "#22c55e", bg: "rgba(34,197,94,0.13)",  border: "rgba(34,197,94,0.28)"  },
  amber: { color: "#f97316", bg: "rgba(249,115,22,0.13)", border: "rgba(249,115,22,0.28)" },
  fail:  { color: "#ef4444", bg: "rgba(239,68,68,0.13)",  border: "rgba(239,68,68,0.28)"  },
};

function levelDisplay(level: number) {
  return { integer: Math.floor(level), pct: Math.round((level % 1) * 100) };
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

function tokens(dark: boolean) {
  return dark
    ? {
        bg: "#0d1117",
        cardBg: "#161b22",
        cardBorder: "#30363d",
        cardShadow: "0 1px 3px rgba(0,0,0,0.4)",
        text: "#e6edf3",
        textSub: "#8b949e",
        textMuted: "#484f58",
        hrColor: "#21262d",
        accent: "#c9d1d9", // light grey — readable on dark
        tierColors: TIER_COLORS_DARK,
      }
    : {
        bg: "#f6f8fa",
        cardBg: "#ffffff",
        cardBorder: "#d0d7de",
        cardShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        text: "#1f2328",
        textSub: "#656d76",
        textMuted: "#9198a1",
        hrColor: "#d8dee4",
        accent: "#2c3e50", // anthracite — typographic, refined
        tierColors: TIER_COLORS,
      };
}

// ─── Sub-components ───────────────────────────────────────────────────────────


function StatPill({
  label,
  shortLabel,
  value,
  sub,
  accent,
  t,
  tooltip,
}: {
  label: string;
  shortLabel?: string;
  value: string;
  sub: string;
  accent: string;
  t: ReturnType<typeof tokens>;
  tooltip?: string;
}) {
  return (
    <div
      className={`relative min-w-0 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border overflow-visible ${tooltip ? "group cursor-help" : ""}`}
      style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
    >
      <div
        className="text-[9px] sm:text-xs uppercase tracking-wide sm:tracking-widest mb-1 truncate"
        style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}
      >
        <span className="sm:hidden">{shortLabel ?? label}</span>
        <span className="hidden sm:inline">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-base sm:text-2xl font-bold leading-none" style={{ color: accent, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 700 }}>
          {value}
        </span>
        <span className="text-[10px] sm:text-sm" style={{ color: t.textMuted }}>
          {sub}
        </span>
      </div>
      {tooltip && (
        <span
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 rounded-lg text-xs leading-snug pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-center z-20"
          style={{ backgroundColor: "#1f2328", color: "#e6edf3", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}
        >
          {tooltip}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2328" }} />
        </span>
      )}
    </div>
  );
}

function SkillBar({
  skill,
  color,
  index,
  t,
}: {
  skill: Skill;
  color: string;
  index: number;
  t: ReturnType<typeof tokens>;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth((skill.level / 20) * 100), 80 + index * 45);
    return () => clearTimeout(timer);
  }, [skill.level, index]);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[15px] font-semibold" style={{ color: t.text, fontFamily: "'HelveticaNeue', sans-serif", letterSpacing: "0.04em" }}>
          {skill.name}
        </span>
        <span className="text-sm tabular-nums" style={{ color, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 500 }}>
          {skill.level.toFixed(2)}
          <span style={{ color: t.textMuted, fontWeight: 400 }}>/20</span>
        </span>
      </div>
      <div
        className="h-[5px] rounded-full overflow-hidden"
        style={{ backgroundColor: t.cardBorder }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Radar chart ─────────────────────────────────────────────────────────────

function SkillRadar({
  skills,
  color,
  t,
}: {
  skills: Skill[];
  color: string;
  t: ReturnType<typeof tokens>;
}) {
  const [visible, setVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const radarSkills = skills.slice(0, 8);
  const n = radarSkills.length;
  if (n < 3) return null;

  const cx = 160, cy = 160, r = 90;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const point = (i: number, ratio: number) => ({
    x: cx + r * ratio * Math.cos(startAngle + i * angleStep),
    y: cy + r * ratio * Math.sin(startAngle + i * angleStep),
  });

  const guideLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = radarSkills.map((s, i) => point(i, s.level / 20));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  return (
    <div>
      <svg viewBox="0 0 320 320" className="w-full max-w-[320px] mx-auto" style={{ overflow: "visible" }}>
        {/* Guide polygons */}
        {guideLevels.map((level) => {
          const pts = radarSkills.map((_, i) => point(i, level));
          const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
          return (
            <path
              key={level}
              d={path}
              fill="none"
              stroke={t.cardBorder}
              strokeWidth={level === 1 ? 1 : 0.5}
              opacity={0.6}
            />
          );
        })}
        {/* Axis lines */}
        {radarSkills.map((_, i) => {
          const end = point(i, 1);
          return (
            <line
              key={i}
              x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke={t.cardBorder}
              strokeWidth={0.5}
              opacity={0.4}
            />
          );
        })}
        {/* Data polygon */}
        <path
          d={dataPath}
          fill={`${color}18`}
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.3)",
            transformOrigin: `${cx}px ${cy}px`,
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        {/* Data points + hover targets */}
        {dataPoints.map((p, i) => (
          <g key={i}>
            {/* Invisible larger hit area */}
            <circle
              cx={p.x} cy={p.y} r={12}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "default" }}
            />
            <circle
              cx={p.x} cy={p.y}
              r={hoveredIndex === i ? 4 : 2.5}
              fill={color}
              style={{
                opacity: visible ? 1 : 0,
                transition: `opacity 0.5s ease ${0.3 + i * 0.05}s, r 0.15s ease`,
              }}
            />
          </g>
        ))}
        {/* Labels */}
        {radarSkills.map((s, i) => {
          const labelR = r + 22;
          const angle = startAngle + i * angleStep;
          const lx = cx + labelR * Math.cos(angle);
          const ly = cy + labelR * Math.sin(angle);
          const isLeft = Math.cos(angle) < -0.1;
          const isRight = Math.cos(angle) > 0.1;
          const isHovered = hoveredIndex === i;
          // Abbreviate long names: keep first word, or first two if short
          const words = s.name.split(/[\s&]+/);
          const short = words[0].length > 10 ? words[0].slice(0, 9) + "." : words.length > 1 && words[0].length + words[1].length < 14 ? words.slice(0, 2).join(" ") : words[0];
          return (
            <text
              key={s.name}
              x={lx}
              y={ly}
              textAnchor={isLeft ? "end" : isRight ? "start" : "middle"}
              dominantBaseline="central"
              fill={isHovered ? color : t.textSub}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                fontSize: "9.5px",
                fontFamily: "'HelveticaNeue', sans-serif",
                fontWeight: isHovered ? 500 : 400,
                cursor: "default",
                transition: "fill 0.15s ease, font-weight 0.15s ease",
              }}
            >
              {isHovered ? s.name : short}
            </text>
          );
        })}
      </svg>
      {/* Hover tooltip */}
      <div
        className="text-center mt-1"
        style={{
          minHeight: "2em",
          opacity: hoveredIndex !== null ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
      >
        {hoveredIndex !== null && (
          <>
            <span className="text-sm font-medium" style={{ color: t.text, fontFamily: "'HelveticaNeue', sans-serif" }}>
              {radarSkills[hoveredIndex].name}
            </span>
            <span className="text-sm ml-2 tabular-nums" style={{ color, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 500 }}>
              {radarSkills[hoveredIndex].level.toFixed(2)}
              <span style={{ color: t.textMuted, fontWeight: 400 }}>/20</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Entrance animation ──────────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60 + delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CVPage({
  profile,
  initialDescriptions,
  correctionNumbers,
  teamStats: initialTeamStats,
  uncachedTeamIds,
  showOutstandingVotes,
  defaultDarkMode,
  rankings,
}: {
  profile: PublicProfile;
  initialDescriptions: Record<string, string | null>;
  correctionNumbers: Record<string, number | null>;
  teamStats: Record<number, TeamStat>;
  uncachedTeamIds: number[];
  showOutstandingVotes: boolean;
  defaultDarkMode: boolean;
  rankings: Rankings | null;
}) {
  const [dark, setDark] = useState(defaultDarkMode);
  const t = tokens(dark);
  const accent = t.accent;

  // localStorage overrides owner's default for this visitor
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

  const mainCursus =
    profile.cursusUsers.find((c) => !c.cursus.slug.includes("piscine")) ??
    profile.cursusUsers[profile.cursusUsers.length - 1];

  const [skillView, setSkillView] = useState<"bars" | "radar">("bars");
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const [projectDescriptions, setProjectDescriptions] = useState<Record<string, string | null | "loading">>(initialDescriptions);
  const [teamStats, setTeamStats] = useState<Record<number, TeamStat>>(initialTeamStats);

  // Fetch uncached team stats in the background after page loads
  useEffect(() => {
    if (uncachedTeamIds.length === 0) return;
    fetch("/api/v2/team-stats", {
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
      fetch(`/api/v2/project-description/${project.slug}`)
        .then((r) => r.json())
        .then(({ description }) =>
          setProjectDescriptions((prev) => ({ ...prev, [project.slug]: description }))
        )
        .catch(() =>
          setProjectDescriptions((prev) => ({ ...prev, [project.slug]: null }))
        );
    }
  };
  const activeCursus = mainCursus;

  const { integer: lvlInt, pct: lvlPct } = levelDisplay(activeCursus?.level ?? 0);

  // Sort by date desc (most recent first), exclude sub-projects
  const validatedProjects = profile.projects
    .filter((p) => p.validated && !p.parentId && p.cursusIds.includes(mainCursus?.cursus.id ?? 0))
    .sort(
      (a, b) =>
        new Date(b.markedAt ?? 0).getTime() - new Date(a.markedAt ?? 0).getTime()
    );

  const skills = [...(activeCursus?.skills ?? [])]
    .sort((a, b) => b.level - a.level)
    .slice(0, 16);

  const outstandingTotal = validatedProjects.reduce((sum, p) => {
    const stat = p.teamId ? teamStats[p.teamId] : null;
    return sum + (stat?.outstandingCount ?? 0);
  }, 0);

  const [lvlBarWidth, setLvlBarWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setLvlBarWidth(lvlPct), 120);
    return () => clearTimeout(timer);
  }, [lvlPct]);

  const title = `${profile.displayname ?? profile.login} — 42 Profile`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={`42 student at ${profile.campus} — level ${lvlInt}, ${validatedProjects.length} validated projects.`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={`Level ${lvlInt} · ${activeCursus?.grade ?? "Student"} · ${profile.campus}`} />
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
        className="min-h-screen transition-colors duration-300 overflow-x-hidden"
        style={{ backgroundColor: t.bg, color: t.text, fontFamily: "'HelveticaNeue', sans-serif" }}
      >
        {/* ── HERO ───────────────────────────────────────────────────── */}
        <header
          className="border-b"
          style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-7 relative">
            {/* Top-right actions */}
            <div className="absolute top-5 sm:top-8 right-4 sm:right-6 z-10 flex items-center gap-2 no-print">
            <button
              onClick={() => {
                const prev = skillView;
                setSkillView("bars");
                setTimeout(() => { window.print(); setSkillView(prev); }, 50);
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-md border text-xs font-medium transition-colors"
              style={{ borderColor: t.cardBorder, backgroundColor: t.bg, color: t.textSub }}
              title="Print / Save as PDF"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-md border text-xs font-medium transition-colors"
              style={{ borderColor: t.cardBorder, backgroundColor: t.bg, color: t.textSub }}
            >
              {dark ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-5a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zm8.66-10a1 1 0 0 1-.5 1.73l-1.73 1a1 1 0 0 1-1-1.73l1.73-1a1 1 0 0 1 1.5.99zM5.57 17.27a1 1 0 0 1-.5 1.73l-1.73 1a1 1 0 1 1-1-1.73l1.73-1a1 1 0 0 1 1.5-.99zM21 12a1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM5 12a1 1 0 0 1-1 1H2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zm14.43 5.27l1.73 1a1 1 0 1 1-1 1.73l-1.73-1a1 1 0 0 1 1-1.73zM4.57 5.27l-1.73-1a1 1 0 0 1 1-1.73l1.73 1a1 1 0 0 1-1 1.73z" /></svg><span className="hidden sm:inline">Light</span></>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" /></svg><span className="hidden sm:inline">Dark</span></>
              )}
            </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
              {/* Avatar */}
              {profile.profileImage && (
                <div
                  className="shrink-0 w-24 h-24 rounded-xl overflow-hidden border"
                  style={{ borderColor: t.cardBorder, boxShadow: t.cardShadow }}
                >
                  <img src={profile.profileImage} alt={profile.login} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Identity */}
              <div className="flex-1 min-w-0 pb-1">
                <h1
                  className="text-3xl sm:text-5xl font-bold tracking-tight leading-none"
                  style={{ fontFamily: "'HelveticaNeue', sans-serif", color: t.text }}
                >
                  {profile.displayname ?? profile.login}
                </h1>

                {/* Row 1: identity */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  <span className="text-sm" style={{ color: accent, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300, letterSpacing: "0.01em" }}>
                    @{profile.login}
                  </span>
                  <span style={{ color: t.cardBorder }}>|</span>
                  <span className="text-sm font-medium" style={{ color: t.textSub }}>
                    {profile.campus}{countryToFlag(profile.campusCountry) ? ` ${countryToFlag(profile.campusCountry)}` : ""}
                  </span>
                  {activeCursus?.grade && (
                    <>
                      <span style={{ color: t.cardBorder }}>|</span>
                      <span className="relative group cursor-help text-sm font-medium" style={{ color: t.textSub }}>
                        {activeCursus.grade}
                        <span
                          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 rounded-lg text-xs leading-snug pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-center z-20"
                          style={{ backgroundColor: "#1f2328", color: "#e6edf3", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}
                        >
                          {{
                            "Transcender": "Successfully passed the 42 Network Common Core",
                            "Member":      "Currently studying at 42, a tuition-free coding school with no teachers — students learn by doing projects and reviewing each other's work",
                            "Learner":     "Currently enrolled at 42, a tuition-free coding school with no teachers — students learn by doing projects and reviewing each other's work",
                          }[activeCursus.grade] ?? `42 Network academic grade`}
                          <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2328" }} />
                        </span>
                      </span>
                    </>
                  )}
                </div>

                {/* Row 2: contact — only if any contact info exists */}
                {(profile.email || profile.phone || profile.address || profile.githubUrl || profile.linkedinUrl) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                    {profile.email && (
                      <a href={`mailto:${profile.email}`} className="text-sm hover:underline" style={{ color: accent, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                        {profile.email}
                      </a>
                    )}
                    {profile.phone && (
                      <>
                        {profile.email && <span style={{ color: t.cardBorder }}>|</span>}
                        <a href={`tel:${profile.phone}`} className="text-sm hover:underline" style={{ color: t.textSub, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                          {profile.phone}
                        </a>
                      </>
                    )}
                    {profile.address && (
                      <>
                        {(profile.email || profile.phone) && <span style={{ color: t.cardBorder }}>|</span>}
                        <a href={`https://maps.google.com/?q=${encodeURIComponent(profile.address)}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: t.textSub, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                          {profile.address}
                        </a>
                      </>
                    )}
                    {profile.githubUrl && (
                      <>
                        {(profile.email || profile.phone || profile.address) && <span style={{ color: t.cardBorder }}>|</span>}
                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm hover:underline" style={{ color: accent }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" /></svg>
                          GitHub
                        </a>
                      </>
                    )}
                    {profile.linkedinUrl && (
                      <>
                        {(profile.email || profile.phone || profile.address || profile.githubUrl) && <span style={{ color: t.cardBorder }}>|</span>}
                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm hover:underline" style={{ color: accent }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                          LinkedIn
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-4 pl-3 overflow-hidden" style={{ borderLeft: `2px solid ${accent}` }}>
                {profile.bio.split("\n").map((line, i) => (
                  <p key={i} className="text-sm leading-relaxed italic" style={{ color: t.textSub, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300, marginTop: i > 0 ? "0.5em" : 0 }}>
                    {line || <br />}
                  </p>
                ))}
              </div>
            )}

            {/* Stat strip — 6 items on desktop, 3+3 on mobile */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6">
              {/* Student since — year big, month small */}
              {activeCursus?.begin_at && (
                <div
                  className="rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border min-w-0"
                  style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
                >
                  <div className="text-[10px] sm:text-xs uppercase tracking-widest mb-1 truncate" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>
                    <span className="sm:hidden">Student since</span>
                    <span className="hidden sm:inline">Student since</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg sm:text-2xl font-bold leading-none" style={{ color: accent, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 700 }}>
                      {new Date(activeCursus.begin_at).getFullYear()}
                    </span>
                    <span className="text-xs sm:text-sm" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>
                      {new Date(activeCursus.begin_at).toLocaleDateString("en", { month: "short" })}
                    </span>
                  </div>
                </div>
              )}

              {/* Projects */}
              <div
                className="rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border min-w-0"
                style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
              >
                <div className="text-[10px] sm:text-xs uppercase tracking-widest mb-1 truncate" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>
                  Projects
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-2xl font-bold leading-none" style={{ color: accent, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 700 }}>
                    {validatedProjects.length}
                  </span>
                  <span className="text-xs sm:text-sm" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>
                    validated
                  </span>
                </div>
              </div>

              {/* Outstanding counter — only if enabled and any exist */}
              {showOutstandingVotes && outstandingTotal > 0 && (
                <div
                  className="relative group rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border min-w-0 cursor-help"
                  style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
                >
                  <div className="text-[9px] sm:text-xs uppercase tracking-wide sm:tracking-widest mb-1 truncate" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>
                    Outstanding
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-2xl font-bold leading-none" style={{ color: "#eab308", fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 700 }}>
                      {outstandingTotal}
                    </span>
                    <span className="text-[10px] sm:text-sm" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>
                      votes
                    </span>
                  </div>
                  <span
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 rounded-lg text-xs leading-snug pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-center z-20"
                    style={{ backgroundColor: "#1f2328", color: "#e6edf3", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}
                  >
                    At 42, all projects are reviewed by fellow students. This is how many times peers gave this student the highest possible rating
                    <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2328" }} />
                  </span>
                </div>
              )}

              {/* Campus Year Rank */}
              {rankings?.campusCohort && (
                <StatPill
                  label={`${profile.campus} ${profile.poolYear} rank`}
                  shortLabel={`${profile.campus} ${profile.poolYear} rank`}
                  value={`#${rankings.campusCohort.rank}`}
                  sub={`/ ${rankings.campusCohort.total}`}
                  accent={accent}
                  t={t}
                  tooltip={`#${rankings.campusCohort.rank} out of ${rankings.campusCohort.total} students at ${profile.campus} who started in ${profile.poolYear}, ranked by level`}
                />
              )}

              {/* Year Rank */}
              {rankings?.cohort && (
                <StatPill
                  label={`${profile.poolYear} rank`}
                  shortLabel={`${profile.poolYear} rank`}
                  value={`#${rankings.cohort.rank}`}
                  sub={`/ ${rankings.cohort.total}`}
                  accent={accent}
                  t={t}
                  tooltip={`#${rankings.cohort.rank} out of ${rankings.cohort.total} students who started at any 42 campus worldwide in ${profile.poolYear}, ranked by level`}
                />
              )}

              {/* All-Time Rank */}
              {rankings?.allTime && (
                <StatPill
                  label="All-time rank"
                  shortLabel="All-time rank"
                  value={`#${rankings.allTime.rank}`}
                  sub={`/ ${rankings.allTime.total}`}
                  accent={accent}
                  t={t}
                  tooltip={`#${rankings.allTime.rank} out of ${rankings.allTime.total} active students across all 42 campuses worldwide, ranked by level`}
                />
              )}
            </div>

            {/* Level card — full width, below the stat cards */}
            <div
              className="mt-3 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border"
              style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
            >
              <div className="text-center text-base mb-2" style={{ color: t.textSub, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 500 }}>
                level {lvlInt} - {lvlPct}%
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: accent, fontFamily: "'HelveticaNeue', sans-serif", minWidth: "1.5rem", textAlign: "right" }}>{lvlInt}</span>
                <div className="relative flex-1 h-[7px] rounded-full overflow-hidden" style={{ backgroundColor: t.hrColor }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${lvlBarWidth}%`, background: `linear-gradient(90deg, ${accent}99, ${accent})` }}
                  />
                </div>
                <span className="text-sm tabular-nums shrink-0" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif", minWidth: "1.5rem" }}>{lvlInt + 1}</span>
              </div>
            </div>
          </div>

        </header>

        {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 print-single-col">
          {/* LEFT: Skills + Achievements */}
          <aside className="space-y-5 order-2 lg:order-1 print-order-1 print-mb lg:sticky lg:top-6 lg:self-start">
            {skills.length > 0 && (
              <FadeIn delay={200}>
              <div
                className="rounded-xl p-6 border"
                style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}
                  >
                    Skills
                  </h2>
                  {skills.length >= 3 && (
                    <button
                      onClick={() => setSkillView((v) => v === "bars" ? "radar" : "bars")}
                      className="no-print flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] uppercase tracking-wider font-medium transition-colors"
                      style={{ borderColor: t.cardBorder, color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}
                    >
                      {skillView === "bars" ? (
                        <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><line x1="12" y1="22" x2="12" y2="15.5"/><line x1="22" y1="8.5" x2="12" y2="15.5"/><line x1="2" y1="8.5" x2="12" y2="15.5"/></svg>Radar</>
                      ) : (
                        <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Bars</>
                      )}
                    </button>
                  )}
                </div>
                {skillView === "bars" ? (
                  <div className="space-y-5">
                    {skills.map((skill, i) => (
                      <SkillBar key={skill.name} skill={skill} color={accent} index={i} t={t} />
                    ))}
                  </div>
                ) : (
                  <SkillRadar skills={skills} color={accent} t={t} />
                )}
              </div>
              </FadeIn>
            )}

            {profile.achievements.length > 0 && (
              <FadeIn delay={350}>
              <div
                className="rounded-xl p-6 border print-break-inside-avoid"
                style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
              >
                <h2
                  className="text-xs font-bold uppercase tracking-widest mb-5"
                  style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}
                >
                  Achievements
                </h2>
                <div className="space-y-3">
                  {profile.achievements.map((a) => {
                    const tierColor =
                      a.tier === "challenge" ? "#a855f7" :
                      a.tier === "hard"      ? "#f97316" :
                      a.tier === "medium"    ? "#3b82f6" :
                      a.tier === "easy"      ? "#22c55e" : accent;
                    return (
                      <div
                        key={a.id}
                        className="pl-3 py-0.5"
                        style={{ borderLeft: `2px solid ${tierColor}` }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <p
                            className="text-[13px] leading-tight"
                            style={{ color: t.text, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 500 }}
                          >
                            {a.name}
                          </p>
                          {a.tier && a.tier !== "none" && (
                            <span
                              className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded"
                              style={{ color: tierColor, backgroundColor: `${tierColor}18`, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 500 }}
                            >
                              {a.tier}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[11px] leading-snug"
                          style={{ color: t.textSub, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}
                        >
                          {a.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              </FadeIn>
            )}

            <div className="text-center pt-1 no-print">
              <Link
                href="/"
                className="text-xs transition-colors"
                style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}
              >
                powered by 42Badge
              </Link>
            </div>
          </aside>

          {/* RIGHT: Projects */}
          <section className="order-1 lg:order-2 print-order-2">
            <FadeIn delay={100}>
            <h2
              className="text-2xl font-bold mb-5"
              style={{ fontFamily: "'HelveticaNeue', sans-serif", color: t.text, letterSpacing: "0.02em" }}
            >
              Validated Projects
              <span className="ml-3 text-base font-normal" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                {validatedProjects.length}
              </span>
            </h2>
            </FadeIn>

            {validatedProjects.length === 0 ? (
              <p className="text-sm" style={{ color: t.textMuted }}>
                No validated projects.
              </p>
            ) : (() => {
              // Group projects by year
              const grouped: { year: string; projects: typeof validatedProjects }[] = [];
              let currentYear = "";
              for (const project of validatedProjects) {
                const year = project.markedAt
                  ? new Date(project.markedAt).getFullYear().toString()
                  : "Unknown";
                if (year !== currentYear) {
                  currentYear = year;
                  grouped.push({ year, projects: [] });
                }
                grouped[grouped.length - 1].projects.push(project);
              }

              return (
                <div className="space-y-6 print-year-gap">
                  {grouped.map((group, gi) => (
                    <FadeIn key={group.year} delay={150 + gi * 80}>
                    <div>
                      {/* Year divider */}
                      <div className="flex items-center gap-4 mb-3">
                        <span
                          className="text-sm font-bold tracking-wider"
                          style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}
                        >
                          {group.year}
                        </span>
                        <div className="flex-1 h-px" style={{ backgroundColor: t.hrColor }} />
                        <span
                          className="text-[11px] tabular-nums"
                          style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}
                        >
                          {group.projects.length} project{group.projects.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Projects card for this year */}
                      <div
                        className="rounded-xl border divide-y overflow-hidden"
                        style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}
                      >
                        {group.projects.map((project) => {
                          const tier = scoreTier(project.finalMark, project.validated);
                          const tColors = t.tierColors[tier];
                          const isExpanded = expandedProjectId === project.id;
                          const desc = projectDescriptions[project.slug];
                          const stat = project.teamId ? teamStats[project.teamId] : null;
                          return (
                            <div
                              key={project.id}
                              className="print-project-row"
                              style={{ borderColor: t.cardBorder }}
                            >
                              {/* Main row */}
                              <div
                                className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 cursor-pointer transition-colors select-none"
                                onClick={() => toggleProject(project)}
                                style={{ backgroundColor: isExpanded ? `${accent}08` : "transparent" }}
                              >
                                {/* Score badge */}
                                <div className="shrink-0">
                                  <span
                                    className="text-sm sm:text-base px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border inline-block min-w-[48px] sm:min-w-[58px] text-center"
                                    style={{
                                      color: tColors.color,
                                      backgroundColor: tColors.bg,
                                      borderColor: tColors.border,
                                      fontFamily: "'HelveticaNeue', sans-serif",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {project.finalMark ?? "—"}
                                  </span>
                                </div>

                                {/* Name + date */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="font-bold text-[13px] sm:text-[15px] uppercase tracking-wide truncate"
                                      style={{ color: t.text, fontFamily: "'HelveticaNeue', sans-serif", letterSpacing: "0.08em" }}
                                    >
                                      {project.name}
                                    </span>
                                    {project.markedAt && (
                                      <span className="hidden sm:inline text-xs shrink-0" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                                        {new Date(project.markedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                      </span>
                                    )}
                                  </div>
                                  {project.markedAt && (
                                    <span className="sm:hidden text-[11px]" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                                      {new Date(project.markedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                    </span>
                                  )}
                                </div>

                                {/* Stars */}
                                {showOutstandingVotes && (() => {
                                  const total = correctionNumbers[project.slug] ?? null;
                                  const outstanding = stat?.outstandingCount ?? 0;
                                  if (!total) return null;
                                  return (
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      {Array.from({ length: total }).map((_, i) => (
                                        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < outstanding ? "#eab308" : "none"} stroke={i < outstanding ? "#eab308" : t.textMuted} strokeWidth="1.5">
                                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                      ))}
                                    </div>
                                  );
                                })()}

                                {/* Chevron + GitHub link + intra link */}
                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 no-print">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: t.textMuted, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                  {profile.projectGithubLinks[project.slug] && (
                                    <a
                                      href={profile.projectGithubLinks[project.slug]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border transition-colors shrink-0"
                                      style={{ borderColor: `${accent}40`, backgroundColor: `${accent}10` }}
                                      title="View on GitHub"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill={accent}>
                                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                      </svg>
                                    </a>
                                  )}
                                  <a
                                    href={`https://projects.intra.42.fr/projects/${project.slug}/projects_users/${project.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border transition-colors shrink-0"
                                    style={{ borderColor: `${accent}40`, backgroundColor: `${accent}10` }}
                                    title="View on 42 Intra"
                                  >
                                    <svg width="14" height="14" viewBox="442 17 44 30" fill={accent} xmlns="http://www.w3.org/2000/svg">
                                      <path d="M442 38.7359H457.473V46.4891H465.194V32.4781H449.748L465.194 17H457.473L442 32.4781V38.7359Z" />
                                      <path d="M468.527 24.7484L476.252 17H468.527V24.7484Z" />
                                      <path d="M476.252 24.7484L468.527 32.4781V40.2031H476.252V32.4781L484 24.7484V17H476.252V24.7484Z" />
                                      <path d="M484 32.4781L476.252 40.2031H484V32.4781Z" />
                                    </svg>
                                  </a>
                                </div>
                              </div>

                              {/* Expanding description panel */}
                              <div style={{ maxHeight: isExpanded ? "200px" : "0px", overflow: "hidden", transition: "max-height 0.28s ease" }}>
                                <div className="px-3 sm:px-5 pb-4 pt-3" style={{ borderTop: `1px solid ${t.cardBorder}` }}>
                                  {desc === "loading" ? (
                                    <p className="text-xs italic" style={{ color: t.textMuted }}>Loading...</p>
                                  ) : desc ? (
                                    <p className="text-[15px] leading-relaxed" style={{ color: t.textSub }}>{desc}</p>
                                  ) : (
                                    <p className="text-sm italic" style={{ color: t.textMuted }}>No description available.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    </FadeIn>
                  ))}
                </div>
              );
            })()}
          </section>
          </div>

        </main>
      </div>
    </>
  );
}

// ─── Data fetching ────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const login = params?.login as string;

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

    const profileImageUrl = user.isDisplayPhoto
      ? data.image?.versions?.medium || data.image?.link || data.image_url
      : null;
    const profileImage = profileImageUrl
      ? await getBase64ImageFromUrl(encodeURI(profileImageUrl)).catch(() => null)
      : null;

    const profile: PublicProfile = {
      login: data.login,
      displayname: user.isDisplayName ? data.displayname : null,
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
      address: (user as any).address ?? null,
      phone: (user as any).phone ?? null,
      bio: (user as any).bio ?? null,
      projectGithubLinks: {},
      achievements: (() => {
        const selectedIds: number[] = (user as any).selectedAchievementIds ?? [];
        if (selectedIds.length === 0) return [];
        return (data.achievements ?? [])
          .filter((a: any) => selectedIds.includes(a.id))
          .map((a: any) => ({ id: a.id, name: a.name, description: a.description, tier: a.tier, kind: a.kind }));
      })(),
    };

    // Load project GitHub links
    const githubLinks = await prisma.projectGithubLink.findMany({
      where: { userId: user.id },
      select: { projectSlug: true, githubUrl: true },
    });
    for (const link of githubLinks) {
      profile.projectGithubLinks[link.projectSlug] = link.githubUrl;
    }

    // Pre-load all project descriptions from DB cache
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

    // Load team stats from DB cache only (fast) — uncached ones fetched client-side
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

    // IDs not in cache (or stale) are sent to client for background fetch
    const uncachedTeamIds = validatedTeamIds.filter((id: number) => !freshIds.has(id));

    const showOutstandingVotes = (user as any).isDisplayOutstandingVotes ?? true;
    const defaultDarkMode = (user as any).defaultDarkMode ?? false;

    // Rankings — read from weekly cache, only expose enabled flags
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

    return { props: { profile, initialDescriptions, correctionNumbers, teamStats: statMap, uncachedTeamIds, showOutstandingVotes, defaultDarkMode, rankings } };
  } catch (e) {
    console.error(e);
    return { notFound: true };
  }
};
