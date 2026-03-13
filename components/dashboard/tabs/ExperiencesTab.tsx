import { WorkExperience, getEmploymentLabel, formatDateRange } from "../../../lib/workExperiences";
import { ExpForm, ExpFormState } from "../ExpForm";

export interface ExperiencesTabProps {
  workExperiences: WorkExperience[];
  loading: boolean;
  showAddForm: boolean;
  editingExpId: string | null;
  expForm: ExpFormState;
  validatedWork42: any[];
  onFormChange: (form: ExpFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: (exp: WorkExperience) => void;
  onDelete: (exp: WorkExperience) => void;
  onAddNew: () => void;
}

export function ExperiencesTab({
  workExperiences,
  loading,
  showAddForm,
  editingExpId,
  expForm,
  validatedWork42,
  onFormChange,
  onSave,
  onCancel,
  onStartEdit,
  onDelete,
  onAddNew,
}: ExperiencesTabProps) {
  return (
    <div className="space-y-4 pt-1">
      <div>
        <p className="text-sm font-medium text-neutral-200 mb-1">Professional Experiences</p>
        <p className="text-xs text-neutral-500 mb-3">
          Any professional experience: full-time jobs, internships, apprenticeships, work-study or freelance.<br />
          Entries with a company name, start date and description appear on your CV.
        </p>
        <div className="mb-3 px-3 py-2 rounded-md bg-amber-950/30 border border-amber-900/50 text-xs text-amber-400">
          The 42 API doesn&apos;t expose contract details - fill in all fields manually, including for 42-validated entries.
        </div>
        {loading ? (
          <p className="text-xs text-neutral-500">Loading…</p>
        ) : (
          <div className="space-y-2">
            {workExperiences.map((exp) => (
              <div key={exp.id} className="px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-md">
                {editingExpId === exp.id ? (
                  <ExpForm form={expForm} setForm={onFormChange} validatedWork42={validatedWork42} onSave={onSave} onCancel={onCancel} />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-200 truncate">
                        {exp.companyName || <span className="text-neutral-500 italic">No company</span>}
                        {exp.companyCity ? ` · ${exp.companyCity}` : ""}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {exp.jobTitle ? `${exp.jobTitle} · ` : ""}{getEmploymentLabel(exp.employmentType)}
                        {exp.finalScore !== null && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border" style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.10)", borderColor: "rgba(34,197,94,0.30)" }}>{exp.finalScore}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{formatDateRange(exp.startDate, exp.endDate)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => onStartEdit(exp)} className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors">Edit</button>
                      <button onClick={() => onDelete(exp)} className="text-xs text-red-500 hover:text-red-400 transition-colors">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {showAddForm ? (
              <div className="px-3 py-3 bg-neutral-800 border border-neutral-700 rounded-md">
                <ExpForm form={expForm} setForm={onFormChange} validatedWork42={validatedWork42} onSave={onSave} onCancel={onCancel} />
              </div>
            ) : (
              <button onClick={onAddNew} className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-300 border border-dashed border-neutral-700 rounded-md transition-colors">
                + Add experience
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
