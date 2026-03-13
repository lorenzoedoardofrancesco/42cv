import { useState } from "react";
import { renderMd } from "../../common/RenderMd";

export interface ProjectsTabProps {
  projectList: any[];
  featuredProjectIds: number[];
  projectDescriptionOverrides: Record<string, string>;
  projectGithubLinks: Record<string, string>;
  onFeaturedToggle: (projectId: number) => void;
  onDescriptionOverrideChange: (slug: string, value: string) => void;
  onDescriptionOverrideBlur: () => void;
  onGithubLinkChange: (slug: string, value: string) => void;
  onGithubLinkBlur: (slug: string) => void;
}

export function ProjectsTab({
  projectList,
  featuredProjectIds,
  projectDescriptionOverrides,
  projectGithubLinks,
  onFeaturedToggle,
  onDescriptionOverrideChange,
  onDescriptionOverrideBlur,
  onGithubLinkChange,
  onGithubLinkBlur,
}: ProjectsTabProps) {
  const [descOverridePreviews, setDescOverridePreviews] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6 pt-1">
      <div>
        <p className="text-sm font-medium text-neutral-200 mb-1">Featured Projects</p>
        <p className="text-xs text-neutral-500 mb-3">Up to 5 projects shown pre-expanded in the Overview tab. Check to select, order is preserved.</p>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {projectList.filter((p: any) => p["validated?"]).map((project: any) => {
            const idx = featuredProjectIds.indexOf(project.id);
            const checked = idx !== -1;
            return (
              <label key={project.id} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={checked} disabled={!checked && featuredProjectIds.length >= 5}
                  onChange={() => onFeaturedToggle(project.id)}
                  className="accent-green-500 shrink-0"
                />
                {checked && <span className="text-[10px] text-neutral-500 w-4 shrink-0 text-center">{idx + 1}</span>}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-neutral-300 group-hover:text-white transition-colors truncate">{project.project.name}</span>
                  <span className="text-[10px] text-neutral-600 shrink-0">{project.final_mark ?? "-"}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {featuredProjectIds.length > 0 && (
        <div>
          <p className="text-sm font-medium text-neutral-200 mb-1">Featured Project Descriptions</p>
          <p className="text-xs text-neutral-500 mb-3">Override the auto-fetched description for each featured project. Leave blank to keep the default.</p>
          <div className="space-y-3">
            {projectList.filter((p: any) => featuredProjectIds.includes(p.id)).map((project: any) => {
              const slug = project.project.slug;
              const preview = !!descOverridePreviews[slug];
              const val = projectDescriptionOverrides[slug] ?? "";
              return (
                <div key={project.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-neutral-400 truncate">{project.project.name}</p>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] text-neutral-600">Markdown available: **bold**, *italic*, `code`</span>
                      <button onClick={() => setDescOverridePreviews((p) => ({ ...p, [slug]: !p[slug] }))}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${preview ? "border-green-700 text-green-400 bg-green-950/30" : "border-neutral-700 text-neutral-500 hover:text-neutral-300"}`}
                      >
                        {preview ? "Edit" : "Preview"}
                      </button>
                    </div>
                  </div>
                  {preview ? (
                    <div className="min-h-[60px] w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 space-y-1">
                      {val.split("\n").filter(Boolean).map((line, i) => (
                        <p key={i} className="text-sm leading-relaxed text-neutral-300">{renderMd(line, "px-1 py-0.5 rounded text-[11px] bg-neutral-700 text-neutral-200")}</p>
                      ))}
                      {!val && <p className="text-neutral-600 text-sm">Nothing to preview yet.</p>}
                    </div>
                  ) : (
                    <textarea
                      value={val}
                      placeholder="Leave blank to use the default description…"
                      rows={2}
                      onChange={(e) => onDescriptionOverrideChange(slug, e.target.value)}
                      onBlur={onDescriptionOverrideBlur}
                      className="w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 resize-none"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-neutral-200 mb-1">Project GitHub Links</p>
        <p className="text-xs text-neutral-500 mb-3">Link each project to its GitHub repo - recruiters see a clickable icon on your CV.</p>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {projectList.map((project: any) => {
            const slug = project.project.slug;
            const currentUrl = projectGithubLinks[slug] ?? "";
            return (
              <div key={project.id} className="flex items-center gap-3">
                <span className="text-xs text-neutral-400 w-36 shrink-0 truncate" title={project.project.name}>{project.project.name}</span>
                <input type="text" value={currentUrl} placeholder="https://github.com/user/repo"
                  onChange={(e) => onGithubLinkChange(slug, e.target.value)}
                  onBlur={() => onGithubLinkBlur(slug)}
                  className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
