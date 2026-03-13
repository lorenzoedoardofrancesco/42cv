import { Si42 } from "@icons-pack/react-simple-icons";
import { PublicProfile, CursusEntry, Rankings } from "./Types";
import { ThemeTokens, levelDisplay } from "./Theme";
import { ordinal, countryToFlag, promoLabel, effectiveCohort } from "./Helpers";
import { renderMd } from "../common/RenderMd";
import { GitHubIcon, LinkedInIcon, WebsiteIcon } from "../common/Icons";
import { StatPill } from "./StatPill";

export function CvHeader({
  profile,
  activeCursus,
  accent,
  t,
  dark,
  toggleTheme,
  skillView,
  setSkillView,
  validatedProjectCount,
  outstandingTotal,
  showOutstandingVotes,
  rankings,
  lvlBarWidth,
  showJourneyTab,
  view,
  setView,
}: {
  profile: PublicProfile;
  activeCursus: CursusEntry | undefined;
  accent: string;
  t: ThemeTokens;
  dark: boolean;
  toggleTheme: () => void;
  skillView: "bars" | "radar";
  setSkillView: (v: "bars" | "radar") => void;
  validatedProjectCount: number;
  outstandingTotal: number;
  showOutstandingVotes: boolean;
  rankings: Rankings | null;
  lvlBarWidth: number;
  showJourneyTab: boolean;
  view: "overview" | "full";
  setView: (v: "overview" | "full") => void;
}) {
  const { integer: lvlInt, pct: lvlPct } = levelDisplay(activeCursus?.level ?? 0);

  return (
    <header className="border-b" style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-3 relative">
        <div className="absolute top-5 sm:top-8 right-4 sm:right-6 z-10 flex flex-col items-end gap-2 no-print">
          <div className="flex items-center gap-2">
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
        </div>

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-7 items-center sm:items-center">
          {profile.profileImage && (
            <div className="shrink-0 self-start sm:self-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden" style={{ boxShadow: `0 0 0 3px ${accent}55, 0 4px 20px rgba(0,0,0,0.35)` }}>
                <img src={profile.profileImage} alt={profile.login} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-none" style={{ fontFamily: "'HelveticaNeue', sans-serif", color: t.text }}>
              {profile.displayname ?? profile.login}
            </h1>

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
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 rounded-lg text-xs leading-snug pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-center z-20" style={{ backgroundColor: "#1f2328", color: "#e6edf3", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                      {{
                        "Transcender": "Successfully passed the 42 Network Common Core",
                        "Member":      "Currently studying at 42, a tuition-free coding school with no teachers - students learn by doing projects and reviewing each other's work",
                        "Learner":     "Currently enrolled at 42, a tuition-free coding school with no teachers - students learn by doing projects and reviewing each other's work",
                      }[activeCursus.grade] ?? `42 Network academic grade`}
                      <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2328" }} />
                    </span>
                  </span>
                </>
              )}
            </div>

            {(profile.email || profile.phone || profile.address || profile.githubUrl || profile.linkedinUrl || profile.websiteUrl) && (
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
                      <GitHubIcon size={13} color={accent} />
                      GitHub
                    </a>
                  </>
                )}
                {profile.linkedinUrl && (
                  <>
                    {(profile.email || profile.phone || profile.address || profile.githubUrl) && <span style={{ color: t.cardBorder }}>|</span>}
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm hover:underline" style={{ color: accent }}>
                      <LinkedInIcon size={13} color={accent} />
                      LinkedIn
                    </a>
                  </>
                )}
                {profile.websiteUrl && (
                  <>
                    {(profile.email || profile.phone || profile.address || profile.githubUrl || profile.linkedinUrl) && <span style={{ color: t.cardBorder }}>|</span>}
                    <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm hover:underline" style={{ color: accent }}>
                      <WebsiteIcon size={13} color={accent} />
                      Website
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="mt-4 pl-3 overflow-hidden" style={{ borderLeft: `2px solid ${accent}` }}>
            {profile.bio.split("\n").map((line, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: t.textSub, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300, marginTop: i > 0 ? "0.5em" : 0 }}>
                {line ? renderMd(line) : <br />}
              </p>
            ))}
          </div>
        )}

        <div className="mt-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px" style={{ backgroundColor: t.hrColor }} />
            <div className="flex items-center gap-1.5 shrink-0">
              <Si42 size={11} color={t.textMuted} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>Statistics</span>
            </div>
            <div className="flex-1 h-px" style={{ backgroundColor: t.hrColor }} />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {activeCursus?.begin_at && (
              <div className="rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border min-w-0" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
                <div className="text-[10px] sm:text-xs uppercase tracking-widest mb-1 truncate" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>Student since</div>
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

            <div className="relative group cursor-help rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border min-w-0 overflow-visible" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
              <div className="text-[10px] sm:text-xs uppercase tracking-widest mb-1 truncate" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>Projects</div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-bold leading-none" style={{ color: accent, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 700 }}>
                  {validatedProjectCount}
                </span>
                <span className="text-xs sm:text-sm" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>validated</span>
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 rounded-lg text-xs leading-snug pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-center z-20" style={{ backgroundColor: "#1f2328", color: "#e6edf3", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                Number of projects successfully validated at École 42. Each project is peer-reviewed by fellow students.
                <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2328" }} />
              </span>
            </div>

            {showOutstandingVotes && outstandingTotal > 0 && (
              <div className="relative group rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border min-w-0 cursor-help" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
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
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 rounded-lg text-xs leading-snug pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-center z-20" style={{ backgroundColor: "#1f2328", color: "#e6edf3", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                  At 42, all projects are reviewed by fellow students. This is how many times peers gave this student the highest possible rating
                  <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2328" }} />
                </span>
              </div>
            )}

            {rankings?.campusCohort && (() => {
              const cohort = activeCursus ? effectiveCohort(activeCursus.begin_at, profile.poolYear, profile.poolMonth) : null;
              const promo = cohort ? promoLabel(cohort.year, cohort.month) : profile.poolYear;
              return <StatPill label={`${profile.campus} ${promo} rank`} shortLabel={`${profile.campus} ${promo} rank`} value={ordinal(rankings.campusCohort.rank)} sub={`/ ${rankings.campusCohort.total}`} accent={accent} t={t} tooltip={`${ordinal(rankings.campusCohort.rank)} out of ${rankings.campusCohort.total} students at ${profile.campus} who started in ${promo}, ranked by level`} />;
            })()}
            {rankings?.cohort && (() => {
              const cohort = activeCursus ? effectiveCohort(activeCursus.begin_at, profile.poolYear, profile.poolMonth) : null;
              const year = cohort?.year ?? profile.poolYear;
              return <StatPill label={`${year} rank`} shortLabel={`${year} rank`} value={ordinal(rankings.cohort.rank)} sub={`/ ${rankings.cohort.total}`} accent={accent} t={t} tooltip={`${ordinal(rankings.cohort.rank)} out of ${rankings.cohort.total} students who started at any 42 campus worldwide in ${year}, ranked by level`} />;
            })()}
            {rankings?.allTime && (
              <StatPill label="All-time rank" shortLabel="All-time rank" value={ordinal(rankings.allTime.rank)} sub={`/ ${rankings.allTime.total}`} accent={accent} t={t} tooltip={`${ordinal(rankings.allTime.rank)} out of ${rankings.allTime.total} active students across all 42 campuses worldwide, ranked by level`} />
            )}

            {!rankings?.campusCohort && !rankings?.cohort && !rankings?.allTime && (
              <div
                className={`relative group cursor-help col-span-1 ${!(showOutstandingVotes && outstandingTotal > 0) ? "sm:col-span-4" : "sm:col-span-3"} rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border min-w-0 overflow-visible`}
                style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
              >
                <div className="text-[10px] sm:text-xs uppercase tracking-widest mb-1" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>Level</div>
                <div className="flex items-center gap-3">
                  <span className="text-lg sm:text-2xl font-bold leading-none shrink-0" style={{ color: accent, fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 700 }}>{lvlInt}</span>
                  <div className="relative flex-1 h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: t.hrColor }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${lvlBarWidth}%`, background: `linear-gradient(90deg, ${accent}99, ${accent})` }} />
                  </div>
                  <span className="text-xs tabular-nums shrink-0" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>{lvlPct}%</span>
                </div>
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2 rounded-lg text-xs leading-snug pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-center z-20" style={{ backgroundColor: "#1f2328", color: "#e6edf3", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                  École 42 progression level. Reflects overall mastery across all completed projects and skills.
                  <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2328" }} />
                </span>
              </div>
            )}
          </div>

          {(rankings?.campusCohort || rankings?.cohort || rankings?.allTime) && (
            <div className="relative group cursor-help mt-3 py-2.5 flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest shrink-0" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>Level <span className="font-bold" style={{ color: accent }}>{lvlInt}</span></span>
              <div className="relative flex-1 h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: t.hrColor }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${lvlBarWidth}%`, background: `linear-gradient(90deg, ${accent}99, ${accent})` }} />
              </div>
              <span className="text-xs tabular-nums shrink-0" style={{ color: t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}>{lvlPct}%</span>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-64 px-3 py-2 rounded-lg text-xs leading-snug pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-center z-20" style={{ backgroundColor: "#1f2328", color: "#e6edf3", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontFamily: "'HelveticaNeue', sans-serif", fontWeight: 300 }}>
                École 42 progression level. Reflects overall mastery across all completed projects and skills.
                <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2328" }} />
              </span>
            </div>
          )}
        </div>
      </div>

      {showJourneyTab && (
        <div className="no-print max-w-6xl mx-auto px-4 sm:px-6 pt-0 pb-0 flex gap-1">
          <button
            onClick={() => setView("overview")}
            className="px-4 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors"
            style={{ borderBottomColor: view === "overview" ? accent : "transparent", color: view === "overview" ? accent : t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}
          >
            Resume
          </button>
          <button
            onClick={() => setView("full")}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors"
            style={{ borderBottomColor: view === "full" ? accent : "transparent", color: view === "full" ? accent : t.textMuted, fontFamily: "'HelveticaNeue', sans-serif" }}
          >
            <Si42 size={10} color={view === "full" ? accent : t.textMuted} />
            Journey
          </button>
        </div>
      )}
    </header>
  );
}
