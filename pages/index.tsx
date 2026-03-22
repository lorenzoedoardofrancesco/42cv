import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import Code from "../components/Code";
import collection from "lodash-es/collection";
import { AuthContext, withAuth } from "../lib/auth/AuthProvider";
import axios from "axios";
import getCoalitions from "../lib/getCoalitions";
import ProjectScore from "../components/badge/ProjectScore";
import { WORK_EXP_SLUGS, WorkExperience } from "../lib/workExperiences";
import { useModal } from "../components/common/AppModal";
import { StarButton } from "../components/common/StarButton";
import { SelectField } from "../components/common/SelectField";
import { ToggleSwitch } from "../components/common/ToggleSwitch";
import { StatsWrapper } from "../components/dashboard/StatsWrapper";
import { StatsOptions } from "../components/dashboard/StatsOptions";
import { FeedbackForm } from "../components/dashboard/FeedbackForm";
import { SkillTagItem } from "../components/dashboard/SkillTagsEditor";
import { ExpFormState } from "../components/dashboard/ExpForm";
import { parseCredlyBadgeId } from "../components/dashboard/Helpers";
import { ProfileTab } from "../components/dashboard/tabs/ProfileTab";
import { ExperiencesTab } from "../components/dashboard/tabs/ExperiencesTab";
import { ProjectsTab } from "../components/dashboard/tabs/ProjectsTab";
import { CertificationsTab } from "../components/dashboard/tabs/CertificationsTab";
import { SettingsTab } from "../components/dashboard/tabs/SettingsTab";

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
  const { show: showModal, node: modalNode } = useModal();

  const patchMe = useCallback(async (updates: Record<string, any>) => {
    try {
      await axios.patch("/api/me", {
        isDisplayEmail: isDisplayEmail ? "true" : "false",
        isDisplayName: isDisplayName ? "true" : "false",
        ...updates,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to save changes.";
      showModal({ title: "Error", message: msg, icon: "alert" });
    }
  }, [isDisplayEmail, isDisplayName, showModal]);

  const [photoMode, setPhotoMode] = useState<"none" | "42campus" | "custom">((data as any).photoMode ?? "none");
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>((data as any).customPhotoUrl ?? "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [starCount, setStarCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("https://api.github.com/repos/lorenzoedoardofrancesco/42cv")
      .then((r) => r.json())
      .then((d) => { if (typeof d.stargazers_count === "number") setStarCount(d.stargazers_count); })
      .catch(() => {});
  }, []);

  const [isDisplayProjectCount, setIsDisplayProjectCount] = useState((data as any).isDisplayProjectCount ?? true);
  const [isPublicProfile, setIsPublicProfile] = useState((data as any).isPublicProfile ?? false);
  const [isDisplayOutstandingVotes, setIsDisplayOutstandingVotes] = useState((data as any).isDisplayOutstandingVotes ?? true);
  const [isDisplayJourney, setIsDisplayJourney] = useState<boolean>((data as any).isDisplayJourney ?? true);
  const [selectedAchievementIds, setSelectedAchievementIds] = useState<number[]>((data as any).selectedAchievementIds ?? []);
  const [githubUrl, setGithubUrl] = useState<string>((data as any).githubUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState<string>((data as any).linkedinUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState<string>((data as any).websiteUrl ?? "");
  const [address, setAddress] = useState<string>((data as any).address ?? "");
  const [phone, setPhone] = useState<string>((data as any).phone ?? "");
  const [defaultDarkMode, setDefaultDarkMode] = useState<boolean>((data as any).defaultDarkMode ?? false);
  const [isDisplayCampusCohortRank, setIsDisplayCampusCohortRank] = useState<boolean>((data as any).isDisplayCampusCohortRank ?? false);
  const [isDisplayCohortRank, setIsDisplayCohortRank] = useState<boolean>((data as any).isDisplayCohortRank ?? false);
  const [isDisplayAllTimeRank, setIsDisplayAllTimeRank] = useState<boolean>((data as any).isDisplayAllTimeRank ?? false);
  const [bio, setBio] = useState<string>((data as any).bio ?? "");
  const [skillTags, setSkillTags] = useState<SkillTagItem[]>(
    ((data as any).skillTags ?? []).map((t: any) => ({
      category: t.category,
      items: Array.isArray(t.items) ? t.items : typeof t.items === "string" ? t.items.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
    }))
  );
  const [featuredProjectIds, setFeaturedProjectIds] = useState<number[]>((data as any).featuredProjectIds ?? []);
  const [projectDescriptionOverrides, setProjectDescriptionOverrides] = useState<Record<string, string>>((data as any).projectDescriptionOverrides ?? {});
  const [activeTab, setActiveTab] = useState<"profile" | "experiences" | "projects" | "certifications" | "settings">("profile");
  const [credlyBadges, setCredlyBadges] = useState<{ id: string; name?: string; imageUrl?: string; issuer?: string; label?: string }[]>(((data as any).credlyBadges as any[]) ?? []);
  const [credlyInput, setCredlyInput] = useState("");
  const [credlyAdding, setCredlyAdding] = useState(false);
  const addCredlyBadge = useCallback(async (input: string, showErrors: boolean) => {
    const id = parseCredlyBadgeId(input);
    if (!id) { if (showErrors) showModal({ title: "Invalid badge", message: "Could not find a valid Credly badge ID.", icon: "alert" }); return; }
    if (credlyBadges.some((b) => b.id === id)) { if (showErrors) showModal({ title: "Already added", message: "This badge is already on your CV.", icon: "info" }); return; }
    setCredlyAdding(true);
    let meta: { name?: string; imageUrl?: string; issuer?: string } = {};
    try {
      const r = await axios.get(`/api/credly-badge?id=${id}`);
      meta = r.data;
    } catch (err: any) {
      setCredlyAdding(false);
      const msg = err?.response?.data?.error ?? "Failed to fetch badge.";
      if (showErrors) showModal({ title: err?.response?.status === 403 ? "Badge ownership mismatch" : "Failed to fetch badge", message: msg, icon: "alert" });
      return;
    }
    const next = [...credlyBadges, { id, ...meta }];
    setCredlyBadges(next);
    setCredlyInput("");
    await patchMe({ credlyBadges: next });
    setCredlyAdding(false);
  }, [credlyBadges, patchMe, showModal]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [expLoading, setExpLoading] = useState(true);
  const [showAddExp, setShowAddExp] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState<ExpFormState>({
    type: "EXTERNAL",
    projectSlug: "",
    jobTitle: "",
    employmentType: "internship",
    companyName: "",
    companyCity: "",
    companyCountry: "",
    startDate: null,
    endDate: null,
    description: "",
  });

  useEffect(() => {
    axios.get("/api/me/work-experiences").then((r) => {
      setWorkExperiences(sortExps(r.data));
      setExpLoading(false);
    }).catch(() => setExpLoading(false));
  }, []);

  const resetExpForm = () => {
    setExpForm({ type: "EXTERNAL", projectSlug: "", jobTitle: "", employmentType: "internship", companyName: "", companyCity: "", companyCountry: "", startDate: null, endDate: null, description: "" });
    setShowAddExp(false);
    setEditingExpId(null);
  };

  const saveExp = async () => {
    if (!expForm.companyName?.trim() || !expForm.startDate || !expForm.description?.trim()) {
      showModal({ title: "Missing fields", message: "Company, start date, and description are required.", icon: "alert" });
      return;
    }
    try {
      if (editingExpId) {
        const { data: updated } = await axios.patch(`/api/me/work-experiences/${editingExpId}`, expForm);
        setWorkExperiences((prev) => sortExps(prev.map((e) => e.id === editingExpId ? updated : e)));
      } else {
        const { data: created } = await axios.post("/api/me/work-experiences", expForm);
        setWorkExperiences((prev) => sortExps([...prev, created]));
      }
      resetExpForm();
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to save experience.";
      showModal({ title: "Error", message: msg, icon: "alert" });
    }
  };

  const deleteExp = async (id: string) => {
    try {
      await axios.delete(`/api/me/work-experiences/${id}`);
      setWorkExperiences((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to delete experience.";
      showModal({ title: "Error", message: msg, icon: "alert" });
    }
  };

  const startEditExp = (exp: WorkExperience) => {
    setShowAddExp(false);
    setEditingExpId(exp.id);
    setExpForm({
      type: exp.type as "FORTY_TWO" | "EXTERNAL",
      projectSlug: exp.projectSlug ?? "",
      jobTitle: exp.jobTitle ?? "",
      employmentType: exp.employmentType,
      companyName: exp.companyName ?? "",
      companyCity: exp.companyCity ?? "",
      companyCountry: exp.companyCountry ?? "",
      startDate: exp.startDate ?? null,
      endDate: exp.endDate ?? null,
      description: exp.description ?? "",
    });
  };

  const sortExps = (exps: WorkExperience[]) =>
    [...exps].sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));

  const validatedWork42 = useMemo(() => {
    const usedSlugs42 = new Set(workExperiences.filter((e) => e.type === "FORTY_TWO").map((e) => e.projectSlug));
    const editingSlug = editingExpId ? workExperiences.find((e) => e.id === editingExpId)?.projectSlug : null;
    return data.extended42Data.projects_users
      .filter((p: any) => p["validated?"] && WORK_EXP_SLUGS.has(p.project.slug) && (!usedSlugs42.has(p.project.slug) || p.project.slug === editingSlug));
  }, [workExperiences, editingExpId, data.extended42Data.projects_users]);
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

  const cvCompleteness = useMemo(() => {
    const checks = [
      !!bio.trim(),
      !!githubUrl.trim(),
      !!linkedinUrl.trim(),
      !!address.trim(),
      !!phone.trim(),
      Object.values(projectGithubLinks).some((v) => !!v.trim()),
      workExperiences.length > 0,
      skillTags.length > 0,
      featuredProjectIds.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [bio, githubUrl, linkedinUrl, address, phone, projectGithubLinks, workExperiences, skillTags, featuredProjectIds]);
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
        <title>42cv.dev | Your 42 journey, recruiter-ready</title>
        <meta name="description" content="Instant CV page and dynamic stats badges for École 42 students. Share your profile, projects, and skills with recruiters. Just sign in!" />
        <meta property="og:title" content="42cv.dev | Your 42 journey, recruiter-ready" />
        <meta property="og:description" content="Instant CV page and dynamic stats badges for École 42 students. Share your profile, projects, and skills with recruiters." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://42cv.dev" />
        <meta property="og:site_name" content="42cv.dev" />
      </Head>
      <div className="flex sm:hidden justify-center pt-2 pb-1">
        <StarButton starCount={starCount} />
      </div>

      <div className="sm:hidden border-t border-neutral-800 mt-2 mb-0" />

      <section className="space-y-4">
        <div className="text-center pt-2 sm:pt-4">
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
            <ToggleSwitch
              checked={isPublicProfile}
              onChange={async (next) => {
                setIsPublicProfile(next);
                await patchMe({ isPublicProfile: next ? "true" : "false" });
              }}
            />
          </label>
          {isPublicProfile && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-green-950/40 border border-green-800/50 rounded-lg">
                  <span className="text-xs text-green-400 shrink-0">Your CV is live at</span>
                  <a href={`https://42cv.dev/${data.extended42Data.login}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green-300 hover:text-green-100 truncate flex-1">
                    https://42cv.dev/{data.extended42Data.login}
                  </a>
                  <button onClick={() => navigator.clipboard.writeText(`https://42cv.dev/${data.extended42Data.login}`)} className="text-xs text-green-500 hover:text-green-300 shrink-0 transition-colors">Copy</button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-500">CV completeness</span>
                    <span className="text-xs text-neutral-400">{cvCompleteness}%</span>
                  </div>
                  <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cvCompleteness}%`, backgroundColor: cvCompleteness === 100 ? "#22c55e" : cvCompleteness >= 50 ? "#eab308" : "#ef4444" }} />
                  </div>
                </div>
              </div>

              <div className="flex border-b border-neutral-800 -mx-4 px-4 gap-1 overflow-x-auto scrollbar-none">
                {([
                  { id: "profile", label: "Profile" },
                  { id: "experiences", label: "Experiences" },
                  { id: "projects", label: "Projects" },
                  { id: "certifications", label: "Certifications" },
                  { id: "settings", label: "Settings" },
                ] as const).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px shrink-0 ${
                      activeTab === id
                        ? "border-green-500 text-green-400"
                        : "border-transparent text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "profile" && (
                <ProfileTab
                  photoMode={photoMode}
                  customPhotoUrl={customPhotoUrl}
                  photoUploading={photoUploading}
                  onPhotoModeChange={async (mode) => {
                    setPhotoMode(mode);
                    await patchMe({ photoMode: mode });
                  }}
                  onPhotoUpload={async (file) => {
                    if (file.size > 200 * 1024) { showModal({ title: "File too large", message: "Image must be under 200 KB.", icon: "alert" }); return; }
                    setPhotoUploading(true);
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const { data: res } = await axios.post("/api/upload-photo", { dataUrl: reader.result });
                        setCustomPhotoUrl(res.url);
                        setPhotoMode("custom");
                      } catch (err: any) {
                        showModal({ title: "Upload failed", message: err?.response?.data?.error ?? "Something went wrong.", icon: "alert" });
                      } finally {
                        setPhotoUploading(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  onPhotoDelete={async () => {
                    try {
                      await axios.delete("/api/upload-photo");
                      setCustomPhotoUrl("");
                      setPhotoMode("none");
                    } catch (err: any) {
                      showModal({ title: "Error", message: err?.response?.data?.error ?? "Failed to delete photo.", icon: "alert" });
                    }
                  }}
                  bio={bio}
                  onBioChange={setBio}
                  onBioBlur={async () => { await patchMe({ bio }); }}
                  contacts={{ githubUrl, linkedinUrl, websiteUrl, address, phone }}
                  onContactChange={(key, value) => {
                    const setters: Record<string, (v: string) => void> = { githubUrl: setGithubUrl, linkedinUrl: setLinkedinUrl, websiteUrl: setWebsiteUrl, address: setAddress, phone: setPhone };
                    setters[key]?.(value);
                  }}
                  onContactBlur={async (key) => {
                    const values: Record<string, string> = { githubUrl, linkedinUrl, websiteUrl, address, phone };
                    await patchMe({ [key]: values[key] });
                  }}
                  skillTags={skillTags}
                  onSkillTagsChange={async (next) => {
                    setSkillTags(next);
                    await patchMe({ skillTags: next });
                  }}
                  achievements={data.extended42Data.achievements ?? []}
                  selectedAchievementIds={selectedAchievementIds}
                  onAchievementToggle={async (id) => {
                    const next = selectedAchievementIds.includes(id)
                      ? selectedAchievementIds.filter((i) => i !== id)
                      : [...selectedAchievementIds, id];
                    setSelectedAchievementIds(next);
                    await patchMe({ selectedAchievementIds: next });
                  }}
                />
              )}

              {activeTab === "experiences" && (
                <ExperiencesTab
                  workExperiences={workExperiences}
                  loading={expLoading}
                  showAddForm={showAddExp}
                  editingExpId={editingExpId}
                  expForm={expForm}
                  validatedWork42={validatedWork42}
                  onFormChange={setExpForm}
                  onSave={saveExp}
                  onCancel={resetExpForm}
                  onStartEdit={startEditExp}
                  onDelete={(exp) => showModal({ title: "Delete experience", message: "This action cannot be undone.", icon: "trash", confirmLabel: "Delete", confirmVariant: "red", cancelLabel: "Cancel", onConfirm: () => deleteExp(exp.id) })}
                  onAddNew={() => { resetExpForm(); setShowAddExp(true); }}
                />
              )}

              {activeTab === "projects" && (
                <ProjectsTab
                  projectList={projectList}
                  featuredProjectIds={featuredProjectIds}
                  projectDescriptionOverrides={projectDescriptionOverrides}
                  projectGithubLinks={projectGithubLinks}
                  onFeaturedToggle={async (projectId) => {
                    const next = featuredProjectIds.includes(projectId)
                      ? featuredProjectIds.filter((id) => id !== projectId)
                      : [...featuredProjectIds, projectId];
                    setFeaturedProjectIds(next);
                    await patchMe({ featuredProjectIds: next });
                  }}
                  onDescriptionOverrideChange={(slug, value) => {
                    setProjectDescriptionOverrides((prev) => ({ ...prev, [slug]: value }));
                  }}
                  onDescriptionOverrideBlur={async () => { await patchMe({ projectDescriptionOverrides }); }}
                  onGithubLinkChange={(slug, value) => {
                    setProjectGithubLinks((prev) => ({ ...prev, [slug]: value }));
                  }}
                  onGithubLinkBlur={async (slug) => {
                    const val = (projectGithubLinks[slug] ?? "").trim();
                    try {
                      if (val) {
                        await axios.put("/api/project-github-links", { projectSlug: slug, githubUrl: val });
                        setProjectGithubLinks((prev) => ({ ...prev, [slug]: val }));
                      } else {
                        await axios.delete("/api/project-github-links", { data: { projectSlug: slug } });
                        setProjectGithubLinks((prev) => { const next = { ...prev }; delete next[slug]; return next; });
                      }
                    } catch (err: any) {
                      const msg = err?.response?.data?.error ?? "Failed to save link.";
                      showModal({ title: "Invalid URL", message: msg, icon: "alert" });
                    }
                  }}
                />
              )}

              {activeTab === "certifications" && (
                <CertificationsTab
                  credlyBadges={credlyBadges}
                  credlyInput={credlyInput}
                  credlyAdding={credlyAdding}
                  onInputChange={setCredlyInput}
                  onAdd={addCredlyBadge}
                  onRemove={async (i) => {
                    const next = credlyBadges.filter((_, j) => j !== i);
                    setCredlyBadges(next);
                    await patchMe({ credlyBadges: next });
                  }}
                  onLabelChange={(i, label) => {
                    setCredlyBadges((prev) => prev.map((b, j) => j === i ? { ...b, label } : b));
                  }}
                  onLabelBlur={async () => { await patchMe({ credlyBadges }); }}
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
                  campusName={primaryCampus?.name ?? "your campus"}
                  onToggle={async (key, value) => {
                    const setters: Record<string, (v: boolean) => void> = {
                      defaultDarkMode: setDefaultDarkMode,
                      isDisplayCampusCohortRank: setIsDisplayCampusCohortRank,
                      isDisplayCohortRank: setIsDisplayCohortRank,
                      isDisplayAllTimeRank: setIsDisplayAllTimeRank,
                      isDisplayOutstandingVotes: setIsDisplayOutstandingVotes,
                      isDisplayJourney: setIsDisplayJourney,
                    };
                    setters[key]?.(value);
                    await patchMe({ [key]: value ? "true" : "false" });
                  }}
                />
              )}
            </>
          )}
        </div>
      </section>

      <div className="border-t-2 border-neutral-800 my-4" />

      <section className="space-y-4">
        <div className="text-center pt-4">
          <h2 className="text-4xl font-bold tracking-tight text-white">42cv Badge</h2>
          <p className="mt-2 text-neutral-500">
            Dynamically generated badges for your git readmes.
          </p>
        </div>

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
                  ? (photoMode === "custom" && customPhotoUrl) || data.extended42Data.image?.versions?.medium || data.extended42Data.image?.link
                  : null,
                projectCount: isDisplayProjectCount
                  ? data.extended42Data.projects_users.filter(
                      (p) =>
                        p["validated?"] === true &&
                        !p.project.parent_id &&
                        p.cursus_ids.includes(parseInt(cursusId))
                    ).length
                  : null,
                credlyBadges: credlyBadges.length > 0
                  ? credlyBadges.filter((b) => b.imageUrl).map((b) => ({ imageUrl: b.imageUrl!, name: b.name }))
                  : undefined,
              }}
            />
          </div>
        </div>

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
          patchMe={patchMe}
          onError={(msg) => showModal({ title: "Error", message: msg, icon: "alert" })}
        />

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

      <section className="space-y-4">
        <div className="text-center pt-4">
          <h2 className="text-4xl font-bold tracking-tight text-white">Feedback</h2>
          <p className="mt-2 text-neutral-500">
            Found a bug or have an idea? Submit it directly as a GitHub issue - takes 10 seconds.
          </p>
        </div>
        <FeedbackForm login={data.extended42Data.login} />
      </section>

      <div className="hidden sm:block fixed bottom-5 left-5 z-50">
        <StarButton starCount={starCount} />
      </div>

      {modalNode}
    </Layout>
  );
};

export default withAuth(Home, {
  required42account: true,
});
