import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import Code from "../components/Code";
import { WorkExperience } from "../lib/workExperiences";
import { useModal } from "../components/common/AppModal";
import { StarButton } from "../components/common/StarButton";
import { SelectField } from "../components/common/SelectField";
import { ToggleSwitch } from "../components/common/ToggleSwitch";
import { StatsWrapper } from "../components/dashboard/StatsWrapper";
import { StatsOptions } from "../components/dashboard/StatsOptions";
import { FeedbackForm } from "../components/dashboard/FeedbackForm";
import ProjectScore from "../components/badge/ProjectScore";
import { ProfileTab } from "../components/dashboard/tabs/ProfileTab";
import { ExperiencesTab } from "../components/dashboard/tabs/ExperiencesTab";
import { ProjectsTab } from "../components/dashboard/tabs/ProjectsTab";
import { CertificationsTab } from "../components/dashboard/tabs/CertificationsTab";
import { SettingsTab } from "../components/dashboard/tabs/SettingsTab";
import { ExpFormState } from "../components/dashboard/ExpForm";

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_LOGIN = "jdupont";
const MOCK_USER_ID = "demo_user_id";
const MOCK_CAMPUS = "42Paris";
const MOCK_COALITION_COLOR = "#C0C8D8";

const MOCK_WORK_EXPERIENCES: WorkExperience[] = [
  {
    id: "exp-1", type: "FORTY_TWO", projectSlug: "fr-alternance-rncp6-1-an", finalScore: 100,
    jobTitle: "Software Engineer", employmentType: "work_study", companyName: "Capgemini",
    companyCity: "Paris", companyCountry: "France", startDate: "2022-09", endDate: "2023-09",
    description: "Full-stack development on enterprise microservices platform using **TypeScript**, Node.js and PostgreSQL.", order: 0,
  },
  {
    id: "exp-2", type: "EXTERNAL", projectSlug: null, finalScore: null,
    jobTitle: "Backend Engineer", employmentType: "internship", companyName: "Criteo",
    companyCity: "Paris", companyCountry: "France", startDate: "2022-03", endDate: "2022-08",
    description: "Worked on real-time bidding infrastructure in **C++** and Go. Reduced P99 latency by 18%.", order: 1,
  },
  {
    id: "exp-3", type: "EXTERNAL", projectSlug: null, finalScore: null,
    jobTitle: null, employmentType: "freelance", companyName: "Various clients",
    companyCity: null, companyCountry: null, startDate: "2021-01", endDate: null,
    description: "Web development and small tooling projects for local businesses. React, Next.js, Tailwind.", order: 2,
  },
];

const MOCK_SKILL_TAGS = [
  { category: "Programming", items: ["C", "C++", "Python", "TypeScript", "Go"] },
  { category: "Tools", items: ["Git", "Docker", "Linux", "Vim", "Make"] },
  { category: "Libraries & Frameworks", items: ["React", "Next.js", "Tailwind CSS", "libft", "miniRT"] },
];

const MOCK_ACHIEVEMENTS = [
  { id: 1, name: "42 Cadet", description: "You have been selected for the 42 cursus." },
  { id: 2, name: "Code Explorer", description: "You validated your first project." },
  { id: 3, name: "Outstanding Student", description: "You received 42 outstanding flags." },
  { id: 4, name: "Internship Validated", description: "You completed a recognised work experience." },
  { id: 5, name: "Half-Shell", description: "You have completed half of the common core." },
];

const MOCK_PROJECTS: any[] = [
  { id: 1001, "validated?": true, final_mark: 125, project: { name: "ft_transcendence", slug: "ft_transcendence", parent_id: null }, cursus_ids: [21], updated_at: "2024-01-10T00:00:00.000Z" },
  { id: 1002, "validated?": true, final_mark: 100, project: { name: "ft_containers", slug: "ft_containers", parent_id: null }, cursus_ids: [21], updated_at: "2023-11-20T00:00:00.000Z" },
  { id: 1003, "validated?": true, final_mark: 110, project: { name: "webserv", slug: "webserv", parent_id: null }, cursus_ids: [21], updated_at: "2023-09-05T00:00:00.000Z" },
  { id: 1004, "validated?": true, final_mark: 100, project: { name: "cub3D", slug: "cub3d", parent_id: null }, cursus_ids: [21], updated_at: "2023-07-14T00:00:00.000Z" },
  { id: 1005, "validated?": true, final_mark: 84, project: { name: "minishell", slug: "minishell", parent_id: null }, cursus_ids: [21], updated_at: "2023-05-02T00:00:00.000Z" },
  { id: 1006, "validated?": true, final_mark: 100, project: { name: "philosophers", slug: "philosophers", parent_id: null }, cursus_ids: [21], updated_at: "2023-03-18T00:00:00.000Z" },
  { id: 1007, "validated?": true, final_mark: 100, project: { name: "push_swap", slug: "push_swap", parent_id: null }, cursus_ids: [21], updated_at: "2023-01-22T00:00:00.000Z" },
  { id: 1008, "validated?": false, final_mark: 0, project: { name: "ft_irc", slug: "ft_irc", parent_id: null }, cursus_ids: [21], updated_at: "2022-12-01T00:00:00.000Z" },
  { id: 1009, "validated?": null, final_mark: 0, project: { name: "ft_ping", slug: "ft_ping", parent_id: null }, cursus_ids: [21], updated_at: "2022-11-01T00:00:00.000Z" },
];

const MOCK_CREDLY_BADGES = [
  { id: "aws-cloud-practitioner", name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", imageUrl: "https://images.credly.com/size/340x340/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png", label: "" },
];

const MOCK_BADGE_DATA = {
  login: MOCK_LOGIN, name: "Jean Dupont", campus: MOCK_CAMPUS,
  cursus: "42cursus", grade: "Member",
  begin_at: "2021-09-01T00:00:00.000Z", blackholed_at: "2026-12-15T00:00:00.000Z", end_at: null,
  color: MOCK_COALITION_COLOR, email: null, level: 12.54, projectCount: 23,
  credlyBadges: [{ imageUrl: MOCK_CREDLY_BADGES[0].imageUrl, name: MOCK_CREDLY_BADGES[0].name }],
};

const MOCK_BIO = "Systems engineer specialised in **C/C++** and low-level networking. Pursuing the 42cursus while working as a work-study developer. Interested in backend systems, compilers, and OS internals.";

// ── Demo page ──────────────────────────────────────────────────────────────

const noop = () => Promise.resolve();

export default function DemoPage() {
  const { show: showModal, node: modalNode } = useModal();

  const showSignIn = () =>
    showModal({
      title: "Sign in to edit",
      message: "This is a demo. Sign in with your 42 account at 42cv.dev to create and edit your own profile.",
      icon: "info",
    });

  const [activeTab, setActiveTab] = useState<"profile" | "experiences" | "projects" | "certifications" | "settings">("profile");
  const [isDisplayName, setIsDisplayName] = useState(true);
  const [isDisplayEmail, setIsDisplayEmail] = useState(false);
  const [isDisplayPhoto, setIsDisplayPhoto] = useState(false);
  const [isDisplayProjectCount, setIsDisplayProjectCount] = useState(true);
  const [isDisplayCampusCohortRank, setIsDisplayCampusCohortRank] = useState(true);
  const [isDisplayCohortRank, setIsDisplayCohortRank] = useState(false);
  const [isDisplayAllTimeRank, setIsDisplayAllTimeRank] = useState(false);
  const [isDisplayOutstandingVotes, setIsDisplayOutstandingVotes] = useState(true);
  const [isDisplayJourney, setIsDisplayJourney] = useState(true);
  const [defaultDarkMode, setDefaultDarkMode] = useState(false);
  const [selectedAchievementIds, setSelectedAchievementIds] = useState<number[]>([1, 2, 3, 4]);
  const [coalitionId, setCoalitionId] = useState("carbon");
  const [starCount, setStarCount] = useState<number | null>(null);
  const [bio, setBio] = useState(MOCK_BIO);
  const [githubUrl, setGithubUrl] = useState("https://github.com/jdupont");
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com/in/jean-dupont");
  const [websiteUrl, setWebsiteUrl] = useState("https://jdupont.dev");
  const [address, setAddress] = useState("Paris, France");
  const [phone, setPhone] = useState("+33 6 12 34 56 78");
  const [skillTags, setSkillTags] = useState(MOCK_SKILL_TAGS);
  const [featuredProjectIds, setFeaturedProjectIds] = useState([1001, 1002, 1003, 1004, 1005]);
  const [projectDescriptionOverrides, setProjectDescriptionOverrides] = useState<Record<string, string>>({});
  const [projectGithubLinks, setProjectGithubLinks] = useState<Record<string, string>>({
    ft_transcendence: "https://github.com/jdupont/ft_transcendence",
    ft_containers: "https://github.com/jdupont/ft_containers",
    webserv: "https://github.com/jdupont/webserv",
  });
  const [credlyBadges, setCredlyBadges] = useState(MOCK_CREDLY_BADGES);
  const [credlyInput, setCredlyInput] = useState("");
  const [expForm] = useState<ExpFormState>({
    type: "EXTERNAL", projectSlug: "", jobTitle: "", employmentType: "internship",
    companyName: "", companyCity: "", companyCountry: "", startDate: null, endDate: null, description: "",
  });

  const coalitionColors: Record<string, string> = {
    piscine: "#00babc", undefined: "#e0e0e0", level21: "#C8A400",
    midnight: "#818cf8", carbon: "#C0C8D8", rose: "#f472b6", neon: "#e040fb",
  };
  const badgeColor = coalitionColors[coalitionId] ?? MOCK_COALITION_COLOR;

  const badgeData = useMemo(() => ({
    ...MOCK_BADGE_DATA,
    color: badgeColor,
    name: isDisplayName ? MOCK_BADGE_DATA.name : null,
    email: isDisplayEmail ? "jean.dupont@student.42.fr" : null,
    projectCount: isDisplayProjectCount ? MOCK_BADGE_DATA.projectCount : null,
    profileImage: isDisplayPhoto ? "https://avatars.githubusercontent.com/u/583231?v=4" : null,
    credlyBadges: MOCK_CREDLY_BADGES.filter((b) => b.imageUrl).map((b) => ({ imageUrl: b.imageUrl!, name: b.name })),
  }), [badgeColor, isDisplayName, isDisplayEmail, isDisplayProjectCount, isDisplayPhoto]);

  const statsUrl = `https://42cv.dev/api/badge/${MOCK_USER_ID}/stats?cursusId=21&coalitionId=${coalitionId}`;
  const projectUrl = `https://42cv.dev/api/badge/${MOCK_USER_ID}/project`;

  useEffect(() => {
    fetch("https://api.github.com/repos/lorenzoedoardofrancesco/42cv")
      .then((r) => r.json())
      .then((d) => { if (typeof d.stargazers_count === "number") setStarCount(d.stargazers_count); })
      .catch(() => {});
  }, []);

  return (
    <Layout>
      <Head>
        <title>42cv.dev - Demo</title>
      </Head>

      <div className="flex sm:hidden justify-center pt-2 pb-1">
        <StarButton starCount={starCount} />
      </div>
      <div className="sm:hidden border-t border-neutral-800 mt-2 mb-0" />

      <div className="my-4 px-4 py-3 rounded-lg bg-blue-950/40 border border-blue-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-blue-300">You&apos;re viewing a demo account</p>
          <p className="text-xs text-blue-400/70 mt-0.5">All data is fictional. Sign in with your 42 account to create your own profile.</p>
        </div>
        <a href="/" className="shrink-0 px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-center">
          Sign in with 42
        </a>
      </div>

      <section className="space-y-4">
        <div className="text-center pt-2 sm:pt-4">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-white">42cv</h1>
            <span className="px-2 py-0.5 text-xs font-bold tracking-widest uppercase rounded-full bg-green-500/20 text-green-400 border border-green-500/40 animate-pulse">New</span>
          </div>
          <p className="mt-2 text-neutral-500">A recruiter-friendly CV page - shareable in one link.</p>
        </div>

        <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-4">
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-neutral-200">Make profile public</p>
              <p className="text-xs text-neutral-500 mt-0.5">Anyone with the link can view your profile - no login required.</p>
            </div>
            <ToggleSwitch checked={true} onChange={showSignIn} />
          </label>

          <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-green-950/40 border border-green-800/50 rounded-lg">
              <span className="text-xs text-green-400 shrink-0">Your CV is live at</span>
              <span className="text-xs font-medium text-green-300 truncate flex-1">https://42cv.dev/{MOCK_LOGIN}</span>
              <button onClick={() => navigator.clipboard.writeText(`https://42cv.dev/${MOCK_LOGIN}`)} className="text-xs text-green-500 hover:text-green-300 shrink-0 transition-colors">Copy</button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">CV completeness</span>
                <span className="text-xs text-neutral-400">89%</span>
              </div>
              <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500 bg-yellow-500" style={{ width: "89%" }} />
              </div>
            </div>
          </div>

          <div className="flex border-b border-neutral-800 -mx-4 px-4 gap-1 overflow-x-auto scrollbar-none">
            {([
              { id: "profile", label: "Profile" }, { id: "experiences", label: "Experiences" },
              { id: "projects", label: "Projects" }, { id: "certifications", label: "Certifications" },
              { id: "settings", label: "Settings" },
            ] as const).map(({ id, label }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px shrink-0 ${activeTab === id ? "border-green-500 text-green-400" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
              >{label}</button>
            ))}
          </div>

          {activeTab === "profile" && (
            <ProfileTab
              photoMode="none" customPhotoUrl="" photoUploading={false}
              onPhotoModeChange={showSignIn} onPhotoUpload={showSignIn} onPhotoDelete={showSignIn}
              bio={bio} onBioChange={setBio} onBioBlur={showSignIn}
              contacts={{ githubUrl, linkedinUrl, websiteUrl, address, phone }}
              onContactChange={(key, value) => {
                const s: Record<string, (v: string) => void> = { githubUrl: setGithubUrl, linkedinUrl: setLinkedinUrl, websiteUrl: setWebsiteUrl, address: setAddress, phone: setPhone };
                s[key]?.(value);
              }}
              onContactBlur={showSignIn}
              skillTags={skillTags} onSkillTagsChange={async (next) => { setSkillTags(next); showSignIn(); }}
              achievements={MOCK_ACHIEVEMENTS} selectedAchievementIds={selectedAchievementIds}
              onAchievementToggle={(id) => { setSelectedAchievementIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]); showSignIn(); }}
            />
          )}

          {activeTab === "experiences" && (
            <ExperiencesTab
              workExperiences={MOCK_WORK_EXPERIENCES} loading={false} showAddForm={false}
              editingExpId={null} expForm={expForm} validatedWork42={[]}
              onFormChange={noop as any} onSave={showSignIn} onCancel={noop}
              onStartEdit={showSignIn} onDelete={showSignIn} onAddNew={showSignIn}
            />
          )}

          {activeTab === "projects" && (
            <ProjectsTab
              projectList={MOCK_PROJECTS} featuredProjectIds={featuredProjectIds}
              projectDescriptionOverrides={projectDescriptionOverrides}
              projectGithubLinks={projectGithubLinks}
              onFeaturedToggle={(id) => { setFeaturedProjectIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]); showSignIn(); }}
              onDescriptionOverrideChange={(slug, value) => setProjectDescriptionOverrides((p) => ({ ...p, [slug]: value }))}
              onDescriptionOverrideBlur={showSignIn}
              onGithubLinkChange={(slug, value) => setProjectGithubLinks((p) => ({ ...p, [slug]: value }))}
              onGithubLinkBlur={showSignIn}
            />
          )}

          {activeTab === "certifications" && (
            <CertificationsTab
              credlyBadges={credlyBadges} credlyInput={credlyInput} credlyAdding={false}
              onInputChange={setCredlyInput}
              onAdd={() => showSignIn()} onRemove={() => showSignIn()}
              onLabelChange={(i, label) => setCredlyBadges((p) => p.map((b, j) => j === i ? { ...b, label } : b))}
              onLabelBlur={showSignIn}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              defaultDarkMode={defaultDarkMode}
              isDisplayCampusCohortRank={isDisplayCampusCohortRank}
              isDisplayCohortRank={isDisplayCohortRank}
              isDisplayAllTimeRank={isDisplayAllTimeRank}
              isDisplayOutstandingVotes={isDisplayOutstandingVotes}
              isDisplayJourney={isDisplayJourney}
              campusName="Paris"
              onToggle={(key, value) => {
                const s: Record<string, (v: boolean) => void> = {
                  defaultDarkMode: setDefaultDarkMode, isDisplayCampusCohortRank: setIsDisplayCampusCohortRank,
                  isDisplayCohortRank: setIsDisplayCohortRank, isDisplayAllTimeRank: setIsDisplayAllTimeRank,
                  isDisplayOutstandingVotes: setIsDisplayOutstandingVotes, isDisplayJourney: setIsDisplayJourney,
                };
                s[key]?.(value);
                showSignIn();
              }}
            />
          )}
        </div>
      </section>

      <div className="border-t-2 border-neutral-800 my-4" />

      <section className="space-y-4">
        <div className="text-center pt-4">
          <h2 className="text-4xl font-bold tracking-tight text-white">42cv Badge</h2>
          <p className="mt-2 text-neutral-500">Dynamically generated badges for your git readmes.</p>
        </div>
        <div className="flex justify-center">
          <div className="overflow-x-auto max-w-full">
            <StatsWrapper data={badgeData} />
          </div>
        </div>
        <div className="space-y-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg">
          <SelectField label="Cursus" value="21" onChange={noop}>
            <option value="21">42cursus</option>
            <option value="9">C Piscine</option>
          </SelectField>
          <SelectField label="Design" value={coalitionId} onChange={setCoalitionId}>
            <option value="piscine">Piscine</option>
            <option value="undefined">Neutral</option>
            <option value="midnight">Midnight</option>
            <option value="carbon">Carbon</option>
            <option value="rose">Rose</option>
            <option value="neon">Neon</option>
          </SelectField>
        </div>
        <StatsOptions
          isDisplayEmail={isDisplayEmail} isDisplayName={isDisplayName}
          isDisplayPhoto={isDisplayPhoto} isDisplayProjectCount={isDisplayProjectCount}
          setIsDisplayEmail={(v) => { setIsDisplayEmail(v); showSignIn(); }}
          setIsDisplayName={(v) => { setIsDisplayName(v); showSignIn(); }}
          setIsDisplayPhoto={(v) => { setIsDisplayPhoto(v); showSignIn(); }}
          setIsDisplayProjectCount={(v) => { setIsDisplayProjectCount(v); showSignIn(); }}
          patchMe={async () => { showSignIn(); }}
          onError={() => {}}
        />
        <div className="space-y-2">
          <label>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">URL</span>
            <Code code={statsUrl} />
          </label>
          <label>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Markdown</span>
            <Code code={`[![${MOCK_LOGIN}'s 42 stats](${statsUrl})](https://42cv.dev/${MOCK_LOGIN})`} />
          </label>
          <label>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">HTML</span>
            <Code code={`<a href="https://42cv.dev/${MOCK_LOGIN}"><img src="${statsUrl}" alt="${MOCK_LOGIN}'s 42 stats" /></a>`} />
          </label>
        </div>
      </section>

      <hr className="border-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Project Scores</h2>
        <p className="text-sm text-neutral-500">Badge for each project. Copy the markdown into your readme.</p>
        <div className="space-y-1">
          {MOCK_PROJECTS.map((project) => (
            <details key={project.id} className="group">
              <summary className="cursor-pointer flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-neutral-900 transition-colors">
                <span className="flex-1 text-sm font-medium text-neutral-300 group-open:text-white">{project.project.name}</span>
                <ProjectScore data={project} />
              </summary>
              <div className="space-y-2 pl-3 pb-3">
                <label>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Markdown</span>
                  <Code code={`[![${MOCK_LOGIN}'s 42 ${project.project.name} Score](${projectUrl}/${project.id})](https://projects.intra.42.fr/projects/${project.project.slug}/projects_users/${project.id})`} />
                </label>
              </div>
            </details>
          ))}
        </div>
      </section>

      <div className="border-t-2 border-neutral-800 my-4" />

      <section className="space-y-4">
        <div className="text-center pt-4">
          <h2 className="text-4xl font-bold tracking-tight text-white">Feedback</h2>
          <p className="mt-2 text-neutral-500">Found a bug or have an idea? Submit it directly as a GitHub issue - takes 10 seconds.</p>
        </div>
        <FeedbackForm login={MOCK_LOGIN} />
      </section>

      <div className="hidden sm:block fixed bottom-5 left-5 z-50">
        <StarButton starCount={starCount} />
      </div>

      {modalNode}
    </Layout>
  );
}
