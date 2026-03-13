import { useState } from "react";
import { renderMd } from "../../common/RenderMd";
import { SkillTagsEditor, SkillTagItem } from "../SkillTagsEditor";

export interface ProfileTabProps {
  photoMode: "none" | "42campus" | "custom";
  customPhotoUrl: string;
  photoUploading: boolean;
  onPhotoModeChange: (mode: "none" | "42campus" | "custom") => void;
  onPhotoUpload: (file: File) => void;
  onPhotoDelete: () => void;
  bio: string;
  onBioChange: (value: string) => void;
  onBioBlur: () => void;
  contacts: {
    githubUrl: string;
    linkedinUrl: string;
    websiteUrl: string;
    address: string;
    phone: string;
  };
  onContactChange: (key: string, value: string) => void;
  onContactBlur: (key: string) => void;
  skillTags: SkillTagItem[];
  onSkillTagsChange: (tags: SkillTagItem[]) => void;
  achievements: { id: number; name: string; description: string; visible?: boolean }[];
  selectedAchievementIds: number[];
  onAchievementToggle: (id: number) => void;
}

export function ProfileTab({
  photoMode,
  customPhotoUrl,
  photoUploading,
  onPhotoModeChange,
  onPhotoUpload,
  onPhotoDelete,
  bio,
  onBioChange,
  onBioBlur,
  contacts,
  onContactChange,
  onContactBlur,
  skillTags,
  onSkillTagsChange,
  achievements,
  selectedAchievementIds,
  onAchievementToggle,
}: ProfileTabProps) {
  const [bioPreview, setBioPreview] = useState(false);

  const contactFields = [
    { label: "GitHub", key: "githubUrl", value: contacts.githubUrl, placeholder: "https://github.com/username", maxLength: 2000 },
    { label: "LinkedIn", key: "linkedinUrl", value: contacts.linkedinUrl, placeholder: "https://linkedin.com/in/username", maxLength: 2000 },
    { label: "Website", key: "websiteUrl", value: contacts.websiteUrl, placeholder: "https://yourwebsite.com", maxLength: 2000 },
    { label: "Address", key: "address", value: contacts.address, placeholder: "City, Country", maxLength: 200 },
    { label: "Phone", key: "phone", value: contacts.phone, placeholder: "+41 79 000 00 00", maxLength: 20 },
  ];

  return (
    <div className="space-y-6 pt-1">
      <div>
        <p className="text-sm font-medium text-neutral-200 mb-1">Profile Photo</p>
        <p className="text-xs text-neutral-500 mb-3">Choose what appears as your photo on the CV.</p>
        <div className="flex rounded-lg border border-neutral-700 overflow-hidden w-fit mb-4">
          {([
            { value: "none", label: "None" },
            { value: "42campus", label: "42 Campus" },
            { value: "custom", label: "Custom" },
          ] as const).map(({ value, label }) => (
            <button key={value}
              onClick={() => onPhotoModeChange(value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${photoMode === value ? "bg-neutral-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {photoMode === "custom" && (
          <div className="flex items-start gap-4">
            {customPhotoUrl && (
              <div className="relative shrink-0">
                <img src={customPhotoUrl} alt="Custom photo" className="w-16 h-16 rounded-full object-cover border-2 border-neutral-700" />
                <button
                  onClick={onPhotoDelete}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-neutral-900 border border-neutral-600 flex items-center justify-center text-neutral-400 hover:text-red-400 hover:border-red-700 transition-colors"
                  title="Remove photo"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
            <div className="flex-1">
              <label className={`flex items-center justify-center w-full h-16 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-neutral-500 transition-colors ${photoUploading ? "opacity-50 pointer-events-none" : ""}`}>
                <span className="text-xs text-neutral-500 text-center">{photoUploading ? "Uploading…" : "Click to upload JPG/PNG · max 200 KB · square recommended"}</span>
                <input type="file" accept="image/jpeg,image/png" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPhotoUpload(file);
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <hr className="border-neutral-800" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-neutral-200">Bio</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-600">Markdown available: **bold**, *italic*, `code`</span>
            <button onClick={() => setBioPreview((v) => !v)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${bioPreview ? "border-green-700 text-green-400 bg-green-950/30" : "border-neutral-700 text-neutral-500 hover:text-neutral-300"}`}
            >
              {bioPreview ? "Edit" : "Preview"}
            </button>
          </div>
        </div>
        {bioPreview ? (
          <div className="min-h-[120px] w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 space-y-1.5">
            {bio.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} className="text-sm leading-relaxed text-neutral-300">{renderMd(line, "px-1 py-0.5 rounded text-[11px] bg-neutral-700 text-neutral-200")}</p>
            ))}
            {!bio && <p className="text-neutral-600 text-sm">Nothing to preview yet.</p>}
          </div>
        ) : (
          <textarea
            value={bio}
            placeholder="e.g. Systems engineer specialised in C/C++, looking for a backend role."
            onChange={(e) => onBioChange(e.target.value)}
            onBlur={onBioBlur}
            rows={6}
            maxLength={400}
            className="w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 resize-none"
          />
        )}
        <p className="text-xs text-neutral-600 text-right mt-1">{bio.length}/400</p>
      </div>

      <hr className="border-neutral-800" />

      <div>
        <p className="text-sm font-medium text-neutral-200 mb-3">Contact & Links</p>
        <div className="space-y-2">
          {contactFields.map(({ label, key, value, placeholder, maxLength }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 w-20 shrink-0">{label}</span>
              <input type="text" value={value} placeholder={placeholder} maxLength={maxLength}
                onChange={(e) => onContactChange(key, e.target.value)}
                onBlur={() => onContactBlur(key)}
                className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
              />
            </div>
          ))}
        </div>
      </div>

      <hr className="border-neutral-800" />

      <div>
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-sm font-medium text-neutral-200">Skill Tags</p>
          <span className="text-[10px] text-neutral-600">e.g. Programming, Tools, Languages</span>
        </div>
        <p className="text-xs text-neutral-500 mb-3">Freeform skill categories shown in the Overview sidebar.</p>
        <SkillTagsEditor value={skillTags} onChange={onSkillTagsChange} />
      </div>

      <hr className="border-neutral-800" />

      {achievements.length > 0 && (
        <div>
          <p className="text-sm font-medium text-neutral-200 mb-1">Achievements on CV</p>
          <p className="text-xs text-neutral-500 mb-3">Select which achievements to show on your public profile.</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {achievements.filter((a) => a.visible !== false).map((a) => {
              const checked = selectedAchievementIds.includes(a.id);
              return (
                <label key={a.id} className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" checked={checked}
                    onChange={() => onAchievementToggle(a.id)}
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
    </div>
  );
}
