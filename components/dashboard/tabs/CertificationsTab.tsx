export interface CredlyBadge {
  id: string;
  name?: string;
  imageUrl?: string;
  issuer?: string;
  label?: string;
}

export interface CertificationsTabProps {
  credlyBadges: CredlyBadge[];
  credlyInput: string;
  credlyAdding: boolean;
  onInputChange: (value: string) => void;
  onAdd: (input: string, showErrors: boolean) => void;
  onRemove: (index: number) => void;
  onLabelChange: (index: number, label: string) => void;
  onLabelBlur: () => void;
}

export function CertificationsTab({
  credlyBadges,
  credlyInput,
  credlyAdding,
  onInputChange,
  onAdd,
  onRemove,
  onLabelChange,
  onLabelBlur,
}: CertificationsTabProps) {
  return (
    <div className="space-y-6 pt-1">
      <div>
        <p className="text-sm font-medium text-neutral-200 mb-1">Credly Badges</p>
        <p className="text-xs text-neutral-500 mb-3">Paste your Credly embed code, badge URL, or badge ID. Appears on your CV between Work Experience and Projects.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={credlyInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Paste embed HTML, URL, or badge ID…"
            disabled={credlyAdding}
            className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 disabled:opacity-50"
            onKeyDown={(e) => { if (e.key === "Enter") (document.activeElement as HTMLElement)?.blur(); }}
            onBlur={() => onAdd(credlyInput, false)}
          />
          <button
            disabled={credlyAdding}
            onClick={() => onAdd(credlyInput, true)}
            className="px-3 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors shrink-0 disabled:opacity-50"
          >
            {credlyAdding ? "…" : "Add"}
          </button>
        </div>
      </div>

      {credlyBadges.length > 0 && (
        <div className="space-y-3">
          {credlyBadges.map((badge, i) => (
            <div key={badge.id} className="flex items-center gap-3 p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
              {badge.imageUrl && (
                <img src={badge.imageUrl} alt={badge.name ?? badge.id} loading="lazy" className="w-10 h-10 rounded object-contain shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-300 truncate">{badge.name ?? badge.id}</p>
                {badge.issuer && <p className="text-[10px] text-neutral-500 truncate">{badge.issuer}</p>}
                <input
                  type="text"
                  value={badge.label ?? ""}
                  placeholder="Custom label (optional)"
                  onChange={(e) => onLabelChange(i, e.target.value)}
                  onBlur={onLabelBlur}
                  className="mt-1 w-full text-xs bg-neutral-900 border border-neutral-700 text-neutral-300 rounded px-2 py-1 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
                />
              </div>
              <button
                onClick={() => onRemove(i)}
                className="shrink-0 text-neutral-500 hover:text-red-400 transition-colors"
                title="Remove"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
