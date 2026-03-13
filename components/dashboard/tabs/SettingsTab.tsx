import { ToggleSwitch } from "../../common/ToggleSwitch";

export interface SettingsTabProps {
  defaultDarkMode: boolean;
  isDisplayCampusCohortRank: boolean;
  isDisplayCohortRank: boolean;
  isDisplayAllTimeRank: boolean;
  isDisplayOutstandingVotes: boolean;
  isDisplayJourney: boolean;
  campusName: string;
  onToggle: (key: string, value: boolean) => void;
}

export function SettingsTab({
  defaultDarkMode,
  isDisplayCampusCohortRank,
  isDisplayCohortRank,
  isDisplayAllTimeRank,
  isDisplayOutstandingVotes,
  isDisplayJourney,
  campusName,
  onToggle,
}: SettingsTabProps) {
  return (
    <div className="space-y-5 pt-1">
      <label className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-200">Default CV theme</p>
          <p className="text-xs text-neutral-500 mt-0.5">Initial appearance for visitors.</p>
        </div>
        <div className="flex rounded-lg border border-neutral-700 overflow-hidden shrink-0">
          {([{ value: false, icon: "☀️", label: "Light" }, { value: true, icon: "🌙", label: "Dark" }] as const).map(({ value, icon, label }) => (
            <button key={label} onClick={() => onToggle("defaultDarkMode", value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${defaultDarkMode === value ? "bg-neutral-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}
            >
              <span>{icon}</span><span>{label}</span>
            </button>
          ))}
        </div>
      </label>

      <hr className="border-neutral-800" />

      <div>
        <p className="text-sm font-medium text-neutral-200 mb-1">Rankings</p>
        <p className="text-xs text-neutral-500 mb-3">Computed weekly from the full 42 network.</p>
        <div className="space-y-3">
          {([
            { key: "isDisplayCampusCohortRank", label: "Campus cohort rank", desc: `Rank among ${campusName} students from the same pool year.`, value: isDisplayCampusCohortRank },
            { key: "isDisplayCohortRank", label: "Cohort rank", desc: "Rank among all 42 students from the same pool year.", value: isDisplayCohortRank },
            { key: "isDisplayAllTimeRank", label: "All-time rank", desc: "Rank among all 42 students.", value: isDisplayAllTimeRank },
          ]).map(({ key, label, desc, value }) => (
            <label key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-200">{label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
              </div>
              <ToggleSwitch checked={value} onChange={(next) => onToggle(key, next)} />
            </label>
          ))}
        </div>
      </div>

      <hr className="border-neutral-800" />

      <label className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-200">Show outstanding votes</p>
          <p className="text-xs text-neutral-500 mt-0.5">Display star ratings on validated projects.</p>
        </div>
        <ToggleSwitch checked={isDisplayOutstandingVotes} onChange={(next) => onToggle("isDisplayOutstandingVotes", next)} />
      </label>

      <hr className="border-neutral-800" />

      <label className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-200">Show 42 Journey tab</p>
          <p className="text-xs text-neutral-500 mt-0.5">Show the Journey tab on your CV. Only visible when Resume is active.</p>
        </div>
        <ToggleSwitch checked={isDisplayJourney} onChange={(next) => onToggle("isDisplayJourney", next)} />
      </label>
    </div>
  );
}
