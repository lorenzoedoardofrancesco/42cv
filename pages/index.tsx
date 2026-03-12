import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import Stats, { StatsProps } from "../components/badge/Stats";
import Code from "../components/Code";
import collection from "lodash-es/collection";
import { AuthContext, withAuth } from "../lib/auth/AuthProvider";
import { useContext } from "react";
import axios from "axios";
import getCoalitions from "../lib/getCoalitions";
import ProjectScore from "../components/badge/ProjectScore";
import { WORK_EXP_SLUGS, EMPLOYMENT_TYPES, WorkExperience, getEmploymentLabel, formatDateRange } from "../lib/workExperiences";
import { SKILL_PALETTE } from "../lib/skillPalette";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const StatsWrapper = ({ data }: StatsProps) => {
  const [isShow, setIsShow] = useState(false);

  useEffect(() => {
    setIsShow(false);
    const timer = setTimeout(() => {
      setIsShow(true);
    });

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...Object.values(data)]);

  return (
    <div style={{ width: "500px" }}>
      {isShow && <Stats data={data} />}
    </div>
  );
};

type StatsOptionsProps = {
  isDisplayName: boolean;
  isDisplayEmail: boolean;
  isDisplayPhoto: boolean;
  isDisplayProjectCount: boolean;
  setIsDisplayName: (value: boolean) => void;
  setIsDisplayEmail: (value: boolean) => void;
  setIsDisplayPhoto: (value: boolean) => void;
  setIsDisplayProjectCount: (value: boolean) => void;
  patchMe: (updates: Record<string, any>) => Promise<void>;
  onError: (msg: string) => void;
};

const StatsOptions = ({
  isDisplayEmail,
  isDisplayName,
  isDisplayPhoto,
  isDisplayProjectCount,
  setIsDisplayEmail,
  setIsDisplayName,
  setIsDisplayPhoto,
  setIsDisplayProjectCount,
  patchMe,
  onError,
}: StatsOptionsProps) => {
  const [isFetching, setIsFetching] = useState(false);
  const updateOption = useCallback(async () => {
    setIsFetching(true);
    try {
      await patchMe({
        isDisplayPhoto: isDisplayPhoto ? "true" : "false",
        isDisplayProjectCount: isDisplayProjectCount ? "true" : "false",
      });
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response) {
        onError(error.response.data.message);
      } else if (error instanceof Error) {
        onError(error.message);
      }
    }
    setIsFetching(false);
  }, [isDisplayPhoto, isDisplayProjectCount, patchMe, onError]);

  return (
    <div>
      <div className="flex flex-col gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
        <p className="border border-amber-800/50 bg-amber-950/30 text-amber-200/80 rounded-lg p-3 text-sm">
          Changes may take up to 12 hours due to browser and CDN cache.
        </p>
        {([
          { label: "Display Name", value: isDisplayName, set: setIsDisplayName },
          { label: "Display Email", value: isDisplayEmail, set: setIsDisplayEmail },
          { label: "Display Photo", value: isDisplayPhoto, set: setIsDisplayPhoto },
          { label: "Projects", value: isDisplayProjectCount, set: setIsDisplayProjectCount },
        ] as const).map(({ label, value, set }) => (
          <label key={label} className="flex items-center justify-between gap-4">
            <span className="text-sm text-neutral-400">{label}</span>
            <button onClick={() => set(!value)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${value ? "bg-green-600" : "bg-neutral-700"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </label>
        ))}
        <button
          className="text-sm px-4 py-1.5 border border-neutral-700 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isFetching}
          onClick={updateOption}
        >
          {isFetching ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

const SelectField = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <label className="flex items-center gap-3">
    <span className="text-sm text-neutral-400 w-28 shrink-0">{label}</span>
    <select
      className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 appearance-none focus:outline-none focus:border-neutral-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  </label>
);

const FEEDBACK_TYPES = [
  { value: "bug", label: "🐛 Bug report" },
  { value: "feature", label: "✨ Feature request" },
  { value: "other", label: "💬 Other" },
] as const;

const FeedbackForm = ({ login }: { login: string }) => {
  const [type, setType] = useState<string>("feature");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    const labelMap: Record<string, string> = { bug: "bug", feature: "enhancement", other: "question" };
    const issueTitle = encodeURIComponent(`[${type}] ${title.trim()}`);
    const issueBody = encodeURIComponent(`**Submitted by:** @${login}\n\n${body.trim()}`);
    const label = labelMap[type] ?? "question";
    window.open(
      `https://github.com/lorenzoedoardofrancesco/42cv/issues/new?title=${issueTitle}&body=${issueBody}&labels=${label}`,
      "_blank"
    );
  };

  return (
    <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-3">
      <div className="flex gap-2">
        {FEEDBACK_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setType(value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              type === value
                ? "bg-neutral-700 border-neutral-500 text-white"
                : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Short title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
      />
      <textarea
        placeholder="Tell us more (optional)…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 resize-none"
      />
      <button
        onClick={submit}
        disabled={!title.trim()}
        className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
        Open GitHub issue
      </button>
    </div>
  );
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const MonthYearPicker = ({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label: string;
}) => {
  const [localMonth, setLocalMonth] = React.useState(value ? value.split("-")[1] : "");
  const [localYear, setLocalYear]   = React.useState(value ? value.split("-")[0] : "");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => String(currentYear - i));

  const update = (month: string, year: string) => {
    if (month && year) onChange(`${year}-${month}`);
    else onChange(null);
  };

  return (
    <div>
      {label && <p className="text-xs text-neutral-400 mb-1">{label}</p>}
      <div className="flex gap-2">
        <select
          value={localMonth}
          onChange={(e) => { setLocalMonth(e.target.value); update(e.target.value, localYear); }}
          className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-neutral-500"
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
          ))}
        </select>
        <select
          value={localYear}
          onChange={(e) => { setLocalYear(e.target.value); update(localMonth, e.target.value); }}
          className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-neutral-500"
        >
          <option value="">Year</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
};

type SkillTagItem = { category: string; items: string[] };


const TagInput = ({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 min-h-[34px] w-full bg-neutral-900 border border-neutral-600 rounded px-2 py-1.5 cursor-text focus-within:border-neutral-500"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-700 text-neutral-200 text-xs"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(tags.filter((t) => t !== tag)); }}
            className="text-neutral-500 hover:text-neutral-200 leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[80px] bg-transparent text-xs text-neutral-200 outline-none placeholder:text-neutral-600"
      />
    </div>
  );
};

const SortableSkillRow = ({
  id,
  tag,
  index,
  editing,
  formJsx,
  onEdit,
  onRemove,
}: {
  id: string;
  tag: SkillTagItem;
  index: number;
  editing: boolean;
  formJsx: React.ReactNode;
  onEdit: () => void;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const c = SKILL_PALETTE[index % SKILL_PALETTE.length];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-start gap-2 px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-md"
    >
      {editing ? (
        <div className="flex-1">{formJsx}</div>
      ) : (
        <>
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 mt-0.5 text-neutral-600 hover:text-neutral-400 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
          >
            <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
              <circle cx="4" cy="3" r="1.5"/><circle cx="8" cy="3" r="1.5"/>
              <circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
              <circle cx="4" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: c.text }}>{tag.category}</div>
            <div className="flex flex-wrap gap-1.5">
              {tag.items.map((item) => (
                <span key={item} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onEdit} className="text-xs text-neutral-500 hover:text-neutral-300 shrink-0 transition-colors">Edit</button>
          <button onClick={onRemove} className="text-xs text-neutral-600 hover:text-red-400 shrink-0 transition-colors">Delete</button>
        </>
      )}
    </div>
  );
};

const SkillTagsEditor = ({
  value,
  onChange,
}: {
  value: SkillTagItem[];
  onChange: (next: SkillTagItem[]) => void;
}) => {
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [formCategory, setFormCategory] = useState("");
  const [formItems, setFormItems] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const openAdd = () => {
    setEditing(null);
    setFormCategory("");
    setFormItems([]);
    setAdding(true);
  };

  const openEdit = (i: number) => {
    setAdding(false);
    setFormCategory(value[i].category);
    setFormItems(value[i].items);
    setEditing(i);
  };

  const cancelForm = () => {
    setAdding(false);
    setEditing(null);
    setFormCategory("");
    setFormItems([]);
  };

  const saveForm = () => {
    if (!formCategory.trim()) return;
    const entry = { category: formCategory.trim(), items: formItems };
    const next = editing !== null
      ? value.map((t, i) => i === editing ? entry : t)
      : [...value, entry];
    onChange(next);
    cancelForm();
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((t) => t.category === active.id);
      const newIndex = value.findIndex((t) => t.category === over.id);
      onChange(arrayMove(value, oldIndex, newIndex));
    }
  };

  const formJsx = (
    <div className="space-y-2">
      <input
        type="text"
        value={formCategory}
        onChange={(e) => setFormCategory(e.target.value)}
        placeholder="Category (e.g. Languages)"
        className="w-full text-xs bg-neutral-900 border border-neutral-600 text-neutral-200 rounded px-2 py-1 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
        onKeyDown={(e) => e.key === "Enter" && saveForm()}
      />
      <TagInput tags={formItems} onChange={setFormItems} placeholder="Add tags (Enter or comma to confirm)" />
      <div className="flex gap-2">
        <button onClick={saveForm} className="px-3 py-1 text-xs rounded-md bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600 transition-colors">Save</button>
        <button onClick={cancelForm} className="px-3 py-1 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700 transition-colors">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={value.map((t) => t.category)} strategy={verticalListSortingStrategy}>
          {value.map((tag, i) => (
            <SortableSkillRow
              key={tag.category}
              id={tag.category}
              tag={tag}
              index={i}
              editing={editing === i}
              formJsx={formJsx}
              onEdit={() => openEdit(i)}
              onRemove={() => remove(i)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {adding ? (
        <div className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md">{formJsx}</div>
      ) : (
        <button onClick={openAdd} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
          + Add category
        </button>
      )}
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalConfig = {
  title: string;
  message?: string;
  icon?: "alert" | "trash" | "info";
  confirmLabel?: string;
  confirmVariant?: "red" | "green" | "neutral";
  cancelLabel?: string;
  onConfirm?: () => void;
};

function AppModal({ config, onClose }: { config: ModalConfig; onClose: () => void }) {
  const { title, message, icon = "info", confirmLabel, confirmVariant = "neutral", cancelLabel, onConfirm } = config;
  const isAlert = !onConfirm;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 rounded-xl border bg-neutral-900 border-neutral-700 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          {icon === "trash" && (
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </div>
          )}
          {icon === "alert" && (
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          )}
          {icon === "info" && (
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-neutral-100">{title}</p>
            {message && <p className="text-xs text-neutral-500 mt-0.5">{message}</p>}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          {!isAlert && (
            <button onClick={onClose} className="px-4 py-1.5 text-xs rounded-md border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors">
              {cancelLabel ?? "Cancel"}
            </button>
          )}
          <button
            onClick={() => { onConfirm?.(); onClose(); }}
            className={`px-4 py-1.5 text-xs rounded-md font-medium transition-colors text-white ${
              confirmVariant === "red" ? "bg-red-600 hover:bg-red-500" :
              confirmVariant === "green" ? "bg-green-600 hover:bg-green-500" :
              "bg-neutral-700 hover:bg-neutral-600"
            }`}
          >
            {confirmLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

function useModal() {
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const show = useCallback((config: ModalConfig) => setModal(config), []);
  const hide = useCallback(() => setModal(null), []);
  const node = modal ? <AppModal config={modal} onClose={hide} /> : null;
  return { show, node };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCredlyBadgeId(input: string): string | null {
  // Accept: full embed HTML, Credly URL, or bare UUID
  const idMatch = input.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return idMatch ? idMatch[0] : null;
}

function renderMdPreview(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="px-1 py-0.5 rounded text-[11px] bg-neutral-700 text-neutral-200">{part.slice(1, -1)}</code>;
    return part;
  });
}

type ExpFormState = {
  type: "FORTY_TWO" | "EXTERNAL";
  projectSlug: string;
  jobTitle: string;
  employmentType: string;
  companyName: string;
  companyCity: string;
  companyCountry: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
};

const ExpForm = ({
  form,
  setForm,
  validatedWork42,
  onSave,
  onCancel,
}: {
  form: ExpFormState;
  setForm: React.Dispatch<React.SetStateAction<ExpFormState>>;
  validatedWork42: any[];
  onSave: () => void;
  onCancel: () => void;
}) => {
  const set = (key: keyof ExpFormState, val: any) => setForm((f) => ({ ...f, [key]: val }));
  const [isPresent, setIsPresent] = React.useState(form.endDate === null);
  const [descPreview, setDescPreview] = React.useState(false);

  return (
    <div className="space-y-4">
      {/* Type toggle */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-neutral-400 shrink-0">Type</p>
        <div className="flex rounded-md border border-neutral-700 overflow-hidden">
          {(["EXTERNAL", "FORTY_TWO"] as const).map((t) => (
            <button key={t} onClick={() => set("type", t)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${form.type === t ? "bg-neutral-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}
            >
              {t === "FORTY_TWO" ? "42-validated" : "External"}
            </button>
          ))}
        </div>
      </div>

      {form.type === "FORTY_TWO" && (
        <div>
          <p className="text-xs text-neutral-400 mb-1">Linked 42 Project</p>
          <select value={form.projectSlug} onChange={(e) => set("projectSlug", e.target.value)}
            className="w-full text-sm bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-neutral-500"
          >
            <option value="">Select a validated work experience</option>
            {validatedWork42.map((p: any) => (
              <option key={p.id} value={p.project.slug}>{p.project.name} ({p.final_mark ?? "?"})</option>
            ))}
          </select>
        </div>
      )}

      {/* Company row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-neutral-400 mb-1">Company <span className="text-red-500">*</span></p>
          <input type="text" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Acme Corp"
            className="w-full text-sm bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600" />
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">City</p>
          <input type="text" value={form.companyCity} onChange={(e) => set("companyCity", e.target.value)} placeholder="Paris"
            className="w-full text-sm bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600" />
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">Country</p>
          <input type="text" value={form.companyCountry} onChange={(e) => set("companyCountry", e.target.value)} placeholder="France"
            className="w-full text-sm bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600" />
        </div>
      </div>

      {/* Role row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-neutral-400 mb-1">Job Title</p>
          <input type="text" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} placeholder="e.g. Backend Engineer"
            className="w-full text-sm bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600" />
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">Employment Type</p>
          <select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)}
            className="w-full text-sm bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-neutral-500">
            {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Dates row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <MonthYearPicker label="Start Date *" value={form.startDate} onChange={(v) => set("startDate", v)} />
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-neutral-400">End Date</p>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPresent}
                onChange={(e) => {
                  setIsPresent(e.target.checked);
                  if (e.target.checked) set("endDate", null);
                }}
                className="accent-green-500 w-3 h-3"
              />
              <span className="text-xs text-neutral-400">Present</span>
            </label>
          </div>
          {isPresent ? (
            <div className="flex items-center h-[34px] px-2 rounded-md border border-neutral-700 bg-neutral-900/50">
              <span className="text-xs text-neutral-500">Current position</span>
            </div>
          ) : (
            <MonthYearPicker label="" value={form.endDate} onChange={(v) => set("endDate", v)} />
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-1">
          <p className="text-xs text-neutral-400">Description <span className="text-red-500">*</span></p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-600">Markdown: **bold**, *italic*, `code`</span>
            <button onClick={() => setDescPreview((v) => !v)}
              className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${descPreview ? "border-green-700 text-green-400 bg-green-950/30" : "border-neutral-700 text-neutral-500 hover:text-neutral-300"}`}
            >
              {descPreview ? "Edit" : "Preview"}
            </button>
          </div>
        </div>
        {descPreview ? (
          <div className="min-h-[120px] w-full text-sm bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 space-y-1.5">
            {form.description.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} className="text-sm leading-relaxed text-neutral-300">{renderMdPreview(line)}</p>
            ))}
            {!form.description && <p className="text-neutral-600 text-sm">Nothing to preview yet.</p>}
          </div>
        ) : (
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={6}
            placeholder="• Designed and implemented... &#10;• Led the migration of... &#10;• Technologies: C++20, CMake, Git"
            className="w-full text-sm bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 resize-y"
          />
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onSave} className="px-4 py-1.5 text-xs rounded-md bg-green-700 hover:bg-green-600 text-white border border-green-600 transition-colors font-medium">Save</button>
        <button onClick={onCancel} className="px-4 py-1.5 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700 transition-colors">Cancel</button>
      </div>
    </div>
  );
};

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
    await axios.patch("/api/v2/me", {
      isDisplayEmail: isDisplayEmail ? "true" : "false",
      isDisplayName: isDisplayName ? "true" : "false",
      ...updates,
    });
  }, [isDisplayEmail, isDisplayName]);

  const [photoMode, setPhotoMode] = useState<"none" | "42campus" | "custom">((data as any).photoMode ?? "none");
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>((data as any).customPhotoUrl ?? "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isDisplayProjectCount, setIsDisplayProjectCount] = useState((data as any).isDisplayProjectCount ?? true);
  const [isPublicProfile, setIsPublicProfile] = useState((data as any).isPublicProfile ?? false);
  const [isDisplayOutstandingVotes, setIsDisplayOutstandingVotes] = useState((data as any).isDisplayOutstandingVotes ?? true);
  const [isDisplayJourney, setIsDisplayJourney] = useState<boolean>((data as any).isDisplayJourney ?? true);
  const [selectedAchievementIds, setSelectedAchievementIds] = useState<number[]>((data as any).selectedAchievementIds ?? []);
  const [githubUrl, setGithubUrl] = useState<string>((data as any).githubUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState<string>((data as any).linkedinUrl ?? "");
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
  const [descOverridePreviews, setDescOverridePreviews] = useState<Record<string, boolean>>({});
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
    try { const r = await axios.get(`/api/v2/credly-badge?id=${id}`); meta = r.data; } catch {}
    const next = [...credlyBadges, { id, ...meta }];
    setCredlyBadges(next);
    setCredlyInput("");
    await patchMe({ credlyBadges: next });
    setCredlyAdding(false);
  }, [credlyBadges, patchMe, showModal]);
  const [bioPreview, setBioPreview] = useState(false);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [expLoading, setExpLoading] = useState(true);
  const [showAddExp, setShowAddExp] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState<{
    type: "FORTY_TWO" | "EXTERNAL";
    projectSlug: string;
    jobTitle: string;
    employmentType: string;
    companyName: string;
    companyCity: string;
    companyCountry: string;
    startDate: string | null;
    endDate: string | null;
    description: string;
  }>({
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
    axios.get("/api/v2/me/work-experiences").then((r) => {
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
    try {
      if (editingExpId) {
        const { data: updated } = await axios.patch(`/api/v2/me/work-experiences/${editingExpId}`, expForm);
        setWorkExperiences((prev) => sortExps(prev.map((e) => e.id === editingExpId ? updated : e)));
      } else {
        const { data: created } = await axios.post("/api/v2/me/work-experiences", expForm);
        setWorkExperiences((prev) => sortExps([...prev, created]));
      }
      resetExpForm();
    } catch {}
  };

  const deleteExp = async (id: string) => {
    await axios.delete(`/api/v2/me/work-experiences/${id}`);
    setWorkExperiences((prev) => prev.filter((e) => e.id !== id));
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

  const usedSlugs42 = workExperiences.filter((e) => e.type === "FORTY_TWO").map((e) => e.projectSlug);
  const validatedWork42 = data.extended42Data.projects_users
    .filter((p: any) => p["validated?"] && WORK_EXP_SLUGS.has(p.project.slug) && (!usedSlugs42.includes(p.project.slug) || (editingExpId && workExperiences.find(e => e.id === editingExpId)?.projectSlug === p.project.slug)));
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
        <title>42cv.dev</title>
      </Head>
      {/* 42CV Hero + Section */}
      <section className="space-y-4">
        <div className="text-center pt-4">
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
            <button
              onClick={async () => {
                const next = !isPublicProfile;
                setIsPublicProfile(next);
                await patchMe({ isPublicProfile: next ? "true" : "false" });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                isPublicProfile ? "bg-green-600" : "bg-neutral-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublicProfile ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
          {isPublicProfile && (
            <>
              {/* CV link + completeness */}
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

              {/* Tab bar */}
              <div className="flex border-b border-neutral-800 -mx-4 px-4 gap-1">
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
                    className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === id
                        ? "border-green-500 text-green-400"
                        : "border-transparent text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── PROFILE TAB ── */}
              {activeTab === "profile" && (
                <div className="space-y-6 pt-1">
                  {/* Profile Photo */}
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
                          onClick={async () => {
                            setPhotoMode(value);
                            await patchMe({ photoMode: value });
                          }}
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
                              onClick={async () => {
                                await axios.delete("/api/v2/upload-photo");
                                setCustomPhotoUrl("");
                                setPhotoMode("none");
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-neutral-900 border border-neutral-600 flex items-center justify-center text-neutral-400 hover:text-red-400 hover:border-red-700 transition-colors"
                              title="Remove photo"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        )}
                        <div className="flex-1">
                          <label className={`flex items-center justify-center w-full h-16 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-neutral-500 transition-colors ${photoUploading ? "opacity-50 pointer-events-none" : ""}`}>
                            <span className="text-xs text-neutral-500">{photoUploading ? "Uploading…" : "Click to upload JPG/PNG · max 200 KB · square recommended"}</span>
                            <input type="file" accept="image/jpeg,image/png" className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 200 * 1024) { showModal({ title: "File too large", message: "Image must be under 200 KB.", icon: "alert" }); return; }
                                setPhotoUploading(true);
                                const reader = new FileReader();
                                reader.onload = async () => {
                                  try {
                                    const { data: res } = await axios.post("/api/v2/upload-photo", { dataUrl: reader.result });
                                    setCustomPhotoUrl(res.url);
                                    setPhotoMode("custom");
                                  } catch (err: any) {
                                    showModal({ title: "Upload failed", message: err?.response?.data?.message ?? "Something went wrong.", icon: "alert" });
                                  } finally {
                                    setPhotoUploading(false);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  <hr className="border-neutral-800" />
                  {/* Bio */}
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
                          <p key={i} className="text-sm leading-relaxed text-neutral-300">{renderMdPreview(line)}</p>
                        ))}
                        {!bio && <p className="text-neutral-600 text-sm">Nothing to preview yet.</p>}
                      </div>
                    ) : (
                      <textarea
                        value={bio}
                        placeholder="e.g. Systems engineer specialised in C/C++, looking for a backend role."
                        onChange={(e) => setBio(e.target.value)}
                        onBlur={async () => { await patchMe({ bio }); }}
                        rows={6}
                        maxLength={400}
                        className="w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 resize-none"
                      />
                    )}
                    <p className="text-xs text-neutral-600 text-right mt-1">{bio.length}/400</p>
                  </div>

                  <hr className="border-neutral-800" />

                  {/* Contact & Links */}
                  <div>
                    <p className="text-sm font-medium text-neutral-200 mb-3">Contact & Links</p>
                    <div className="space-y-2">
                      {([
                        { label: "GitHub", value: githubUrl, set: setGithubUrl, key: "githubUrl", placeholder: "https://github.com/username" },
                        { label: "LinkedIn", value: linkedinUrl, set: setLinkedinUrl, key: "linkedinUrl", placeholder: "https://linkedin.com/in/username" },
                        { label: "Address", value: address, set: setAddress, key: "address", placeholder: "City, Country" },
                        { label: "Phone", value: phone, set: setPhone, key: "phone", placeholder: "+41 79 000 00 00" },
                      ] as const).map(({ label, value, set, key, placeholder }) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs text-neutral-400 w-20 shrink-0">{label}</span>
                          <input type="text" value={value} placeholder={placeholder} onChange={(e) => set(e.target.value)}
                            onBlur={async () => { await patchMe({ [key]: value }); }}
                            className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className="border-neutral-800" />

                  {/* Skill Tags */}
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <p className="text-sm font-medium text-neutral-200">Skill Tags</p>
                      <span className="text-[10px] text-neutral-600">e.g. Programming, Tools, Languages</span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-3">Freeform skill categories shown in the Overview sidebar.</p>
                    <SkillTagsEditor
                      value={skillTags}
                      onChange={async (next) => {
                        setSkillTags(next);
                        await patchMe({ skillTags: next });
                      }}
                    />
                  </div>

                  <hr className="border-neutral-800" />

                  {/* Achievements */}
                  {(data.extended42Data.achievements ?? []).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-neutral-200 mb-1">Achievements on CV</p>
                      <p className="text-xs text-neutral-500 mb-3">Select which achievements to show on your public profile.</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {(data.extended42Data.achievements as any[]).filter((a) => a.visible !== false).map((a) => {
                          const checked = selectedAchievementIds.includes(a.id);
                          return (
                            <label key={a.id} className="flex items-start gap-3 cursor-pointer group">
                              <input type="checkbox" checked={checked} onChange={async () => {
                                const next = checked ? selectedAchievementIds.filter((id) => id !== a.id) : [...selectedAchievementIds, a.id];
                                setSelectedAchievementIds(next);
                                await patchMe({ selectedAchievementIds: next });
                              }} className="mt-0.5 accent-green-500 shrink-0" />
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
              )}

              {/* ── EXPERIENCES TAB ── */}
              {activeTab === "experiences" && (
                <div className="space-y-4 pt-1">
                  <div>
                    <p className="text-sm font-medium text-neutral-200 mb-1">Professional Experiences</p>
                    <p className="text-xs text-neutral-500 mb-3">
                      Any professional experience: full-time jobs, internships, apprenticeships, work-study or freelance.<br />
                      Entries with a company name, start date and description appear on your CV.
                    </p>
                    <div className="mb-3 px-3 py-2 rounded-md bg-amber-950/30 border border-amber-900/50 text-xs text-amber-400">
                      The 42 API doesn&apos;t expose contract details — fill in all fields manually, including for 42-validated entries.
                    </div>
                    {expLoading ? (
                      <p className="text-xs text-neutral-500">Loading…</p>
                    ) : (
                      <div className="space-y-2">
                        {workExperiences.map((exp) => (
                          <div key={exp.id} className="px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-md">
                            {editingExpId === exp.id ? (
                              <ExpForm form={expForm} setForm={setExpForm} validatedWork42={validatedWork42} onSave={saveExp} onCancel={resetExpForm} />
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
                                  <button onClick={() => startEditExp(exp)} className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors">Edit</button>
                                  <button onClick={() => showModal({ title: "Delete experience", message: "This action cannot be undone.", icon: "trash", confirmLabel: "Delete", confirmVariant: "red", cancelLabel: "Cancel", onConfirm: () => deleteExp(exp.id) })} className="text-xs text-red-500 hover:text-red-400 transition-colors">Delete</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {showAddExp ? (
                          <div className="px-3 py-3 bg-neutral-800 border border-neutral-700 rounded-md">
                            <ExpForm form={expForm} setForm={setExpForm} validatedWork42={validatedWork42} onSave={saveExp} onCancel={resetExpForm} />
                          </div>
                        ) : (
                          <button onClick={() => { resetExpForm(); setShowAddExp(true); }} className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-300 border border-dashed border-neutral-700 rounded-md transition-colors">
                            + Add experience
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PROJECTS TAB ── */}
              {activeTab === "projects" && (
                <div className="space-y-6 pt-1">
                  {/* Featured Projects */}
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
                              onChange={async () => {
                                const next = checked ? featuredProjectIds.filter((id) => id !== project.id) : [...featuredProjectIds, project.id];
                                setFeaturedProjectIds(next);
                                await patchMe({ featuredProjectIds: next });
                              }}
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

                  {/* Featured Project Description Overrides */}
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
                                    <p key={i} className="text-sm leading-relaxed text-neutral-300">{renderMdPreview(line)}</p>
                                  ))}
                                  {!val && <p className="text-neutral-600 text-sm">Nothing to preview yet.</p>}
                                </div>
                              ) : (
                                <textarea
                                  value={val}
                                  placeholder="Leave blank to use the default description…"
                                  rows={2}
                                  onChange={(e) => setProjectDescriptionOverrides((prev) => ({ ...prev, [slug]: e.target.value }))}
                                  onBlur={async () => {
                                    await patchMe({ projectDescriptionOverrides });
                                  }}
                                  className="w-full text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 resize-none"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Project GitHub Links */}
                  <div>
                    <p className="text-sm font-medium text-neutral-200 mb-1">Project GitHub Links</p>
                    <p className="text-xs text-neutral-500 mb-3">Link each project to its GitHub repo — recruiters see a clickable icon on your CV.</p>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {projectList.map((project) => {
                        const slug = project.project.slug;
                        const currentUrl = projectGithubLinks[slug] ?? "";
                        return (
                          <div key={project.id} className="flex items-center gap-3">
                            <span className="text-xs text-neutral-400 w-36 shrink-0 truncate" title={project.project.name}>{project.project.name}</span>
                            <input type="text" value={currentUrl} placeholder="https://github.com/user/repo"
                              onChange={(e) => setProjectGithubLinks((prev) => ({ ...prev, [slug]: e.target.value }))}
                              onBlur={async () => {
                                const val = currentUrl.trim();
                                if (val) {
                                  await axios.put("/api/v2/project-github-links", { projectSlug: slug, githubUrl: val });
                                  setProjectGithubLinks((prev) => ({ ...prev, [slug]: val }));
                                } else {
                                  await axios.delete("/api/v2/project-github-links", { data: { projectSlug: slug } });
                                  setProjectGithubLinks((prev) => { const next = { ...prev }; delete next[slug]; return next; });
                                }
                              }}
                              className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── CERTIFICATIONS TAB ── */}
              {activeTab === "certifications" && (
                <div className="space-y-6 pt-1">
                  <div>
                    <p className="text-sm font-medium text-neutral-200 mb-1">Credly Badges</p>
                    <p className="text-xs text-neutral-500 mb-3">Paste your Credly embed code, badge URL, or badge ID. Appears on your CV between Work Experience and Projects.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={credlyInput}
                        onChange={(e) => setCredlyInput(e.target.value)}
                        placeholder='Paste embed HTML, URL, or badge ID…'
                        disabled={credlyAdding}
                        className="flex-1 text-sm bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 disabled:opacity-50"
                        onKeyDown={async (e) => { if (e.key === "Enter") (document.activeElement as HTMLElement)?.blur(); }}
                        onBlur={() => addCredlyBadge(credlyInput, false)}
                      />
                      <button
                        disabled={credlyAdding}
                        onClick={() => addCredlyBadge(credlyInput, true)}
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
                            <img src={badge.imageUrl} alt={badge.name ?? badge.id} className="w-10 h-10 rounded object-contain shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-neutral-300 truncate">{badge.name ?? badge.id}</p>
                            {badge.issuer && <p className="text-[10px] text-neutral-500 truncate">{badge.issuer}</p>}
                            <input
                              type="text"
                              value={badge.label ?? ""}
                              placeholder="Custom label (optional)"
                              onChange={(e) => {
                                const next = credlyBadges.map((b, j) => j === i ? { ...b, label: e.target.value } : b);
                                setCredlyBadges(next);
                              }}
                              onBlur={async () => {
                                await patchMe({ credlyBadges });
                              }}
                              className="mt-1 w-full text-xs bg-neutral-900 border border-neutral-700 text-neutral-300 rounded px-2 py-1 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
                            />
                          </div>
                          <button
                            onClick={async () => {
                              const next = credlyBadges.filter((_, j) => j !== i);
                              setCredlyBadges(next);
                              await patchMe({ credlyBadges: next });
                            }}
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
              )}

              {/* ── SETTINGS TAB ── */}
              {activeTab === "settings" && (
                <div className="space-y-5 pt-1">
                  {/* Default theme */}
                  <label className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-200">Default CV theme</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Initial appearance for visitors.</p>
                    </div>
                    <div className="flex rounded-lg border border-neutral-700 overflow-hidden shrink-0">
                      {([{ value: false, icon: "☀️", label: "Light" }, { value: true, icon: "🌙", label: "Dark" }] as const).map(({ value, icon, label }) => (
                        <button key={label} onClick={async () => { setDefaultDarkMode(value); await patchMe({ defaultDarkMode: value ? "true" : "false" }); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${defaultDarkMode === value ? "bg-neutral-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}
                        >
                          <span>{icon}</span><span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </label>

                  <hr className="border-neutral-800" />

                  {/* Rankings */}
                  <div>
                    <p className="text-sm font-medium text-neutral-200 mb-1">Rankings</p>
                    <p className="text-xs text-neutral-500 mb-3">Computed weekly from the full 42 network.</p>
                    <div className="space-y-3">
                      {([
                        { key: "isDisplayCampusCohortRank" as const, label: "Campus cohort rank", desc: `Rank among ${primaryCampus?.name ?? "your campus"} students from the same pool year.`, value: isDisplayCampusCohortRank, set: setIsDisplayCampusCohortRank },
                        { key: "isDisplayCohortRank" as const, label: "Cohort rank", desc: "Rank among all 42 students from the same pool year.", value: isDisplayCohortRank, set: setIsDisplayCohortRank },
                        { key: "isDisplayAllTimeRank" as const, label: "All-time rank", desc: "Rank among all 42 students.", value: isDisplayAllTimeRank, set: setIsDisplayAllTimeRank },
                      ] as const).map(({ key, label, desc, value, set }) => (
                        <label key={key} className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-neutral-200">{label}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
                          </div>
                          <button onClick={async () => { const next = !value; set(next); await patchMe({ [key]: next ? "true" : "false" }); }}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${value ? "bg-green-600" : "bg-neutral-700"}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </label>
                      ))}
                    </div>
                  </div>

                  <hr className="border-neutral-800" />

                  {/* Outstanding votes */}
                  <label className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-200">Show outstanding votes</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Display star ratings on validated projects.</p>
                    </div>
                    <button onClick={async () => { const next = !isDisplayOutstandingVotes; setIsDisplayOutstandingVotes(next); await patchMe({ isDisplayOutstandingVotes: next ? "true" : "false" }); }}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isDisplayOutstandingVotes ? "bg-green-600" : "bg-neutral-700"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDisplayOutstandingVotes ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </label>

                  <hr className="border-neutral-800" />

                  {/* Journey tab */}
                  <label className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-200">Show 42 Journey tab</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Show the Journey tab on your CV. Only visible when Resume is active.</p>
                    </div>
                    <button onClick={async () => { const next = !isDisplayJourney; setIsDisplayJourney(next); await patchMe({ isDisplayJourney: next ? "true" : "false" }); }}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isDisplayJourney ? "bg-green-600" : "bg-neutral-700"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDisplayJourney ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </label>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <div className="border-t-2 border-neutral-800 my-4" />

      {/* Stats Card Section */}
      <section className="space-y-4">
        <div className="text-center pt-4">
          <h2 className="text-4xl font-bold tracking-tight text-white">42cv Badge</h2>
          <p className="mt-2 text-neutral-500">
            Dynamically generated badges for your git readmes.
          </p>
        </div>

        {/* Preview */}
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

        {/* Controls */}
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

        {/* Code snippets */}
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

      {/* Project Score Section */}
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

      {/* Feedback Section */}
      <section className="space-y-4">
        <div className="text-center pt-4">
          <h2 className="text-4xl font-bold tracking-tight text-white">Feedback</h2>
          <p className="mt-2 text-neutral-500">
            Found a bug or have an idea? Submit it directly as a GitHub issue - takes 10 seconds.
          </p>
        </div>
        <FeedbackForm login={data.extended42Data.login} />
      </section>

      {modalNode}
    </Layout>
  );
};

export default withAuth(Home, {
  required42account: true,
});
