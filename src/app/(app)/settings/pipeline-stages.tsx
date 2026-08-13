"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { FIELD_CLASS } from "@/components/ui/form";
import {
  createStage,
  deleteStage,
  moveStage,
  renameStage,
} from "@/lib/data/actions/stages";
import type { StageAdminRow } from "@/lib/data/deals";

/**
 * The pipeline, as configuration — the Settings card the schema always
 * implied: stages live in their own table with a position precisely so the
 * team can reshape them without touching a single deal.
 *
 * Rendered for admins only — Settings shows what you can act on, and a
 * member meets the pipeline where they use it, as the stepper on a deal.
 * canManage stays a real prop all the same: the actions behind it check
 * isAdmin() themselves and RLS (pipeline_stages_write_admin) checks again,
 * so hiding the card is presentation, not the permission.
 *
 * Won and Lost render locked. resolveStage() derives deals.status from
 * those two names, so renaming/moving/deleting them would change how deals
 * close — the lock icon says "system", the actions refuse anyway.
 */
export function PipelineStages({
  stages,
  canManage,
}: {
  stages: StageAdminRow[];
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const working = stages.filter((s) => s.name !== "Won" && s.name !== "Lost");

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div>
      <ul className="divide-y divide-brand-200/40">
        {stages.map((stage, i) => (
          <StageRow
            key={stage.id}
            stage={stage}
            canManage={canManage}
            pending={pending}
            isFirstWorking={working[0]?.id === stage.id}
            isLastWorking={working[working.length - 1]?.id === stage.id}
            onRename={(name) => run(() => renameStage(stage.id, name))}
            onMove={(dir) => run(() => moveStage(stage.id, dir))}
            onDelete={() => run(() => deleteStage(stage.id))}
            index={i}
          />
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}

      {canManage && (
        <AddStage
          working={working}
          pending={pending}
          onCreate={(name, afterId) => run(() => createStage(name, afterId))}
        />
      )}
    </div>
  );
}

function StageRow({
  stage,
  canManage,
  pending,
  isFirstWorking,
  isLastWorking,
  onRename,
  onMove,
  onDelete,
  index,
}: {
  stage: StageAdminRow;
  canManage: boolean;
  pending: boolean;
  isFirstWorking: boolean;
  isLastWorking: boolean;
  onRename: (name: string) => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
  index: number;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState(stage.name);

  const terminal = stage.name === "Won" || stage.name === "Lost";
  // Deals block a delete outright; history blocks it too (both FKs are
  // RESTRICT) — each gets its own sentence instead of a dead button.
  const blockedBy =
    stage.dealCount > 0
      ? `${stage.dealCount} ${stage.dealCount === 1 ? "deal" : "deals"} on this stage — move them first`
      : stage.transitionCount > 0
        ? "in the stage history — can't be deleted"
        : null;

  function saveRename() {
    setEditing(false);
    if (name.trim() && name.trim() !== stage.name) onRename(name.trim());
    else setName(stage.name);
  }

  return (
    <li className="py-3" style={{ "--enter-delay": `${index * 30}ms` } as React.CSSProperties}>
      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename();
                if (e.key === "Escape") {
                  setEditing(false);
                  setName(stage.name);
                }
              }}
              autoFocus
              aria-label={`New name for ${stage.name}`}
              className={FIELD_CLASS + " max-w-56 py-1.5"}
            />
            <IconButton label="Save name" onClick={saveRename} disabled={pending}>
              <Check className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton
              label="Cancel rename"
              onClick={() => {
                setEditing(false);
                setName(stage.name);
              }}
              disabled={pending}
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          </span>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm font-medium text-gray-900">{stage.name}</span>
            {terminal && (
              <Lock className="h-3.5 w-3.5 shrink-0 text-gray-300" strokeWidth={2} aria-hidden />
            )}
            <span className="shrink-0 rounded-full bg-brand-100/70 px-2 py-0.5 text-xs font-medium text-brand-500 tabular-nums">
              {stage.dealCount === 1 ? "1 deal" : `${stage.dealCount} deals`}
            </span>
          </span>
        )}

        {canManage && !terminal && !editing && (
          <span className="flex shrink-0 items-center gap-1">
            <IconButton
              label={`Move ${stage.name} up`}
              onClick={() => onMove("up")}
              disabled={pending || isFirstWorking}
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton
              label={`Move ${stage.name} down`}
              onClick={() => onMove("down")}
              disabled={pending || isLastWorking}
            >
              <ArrowDown className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton label={`Rename ${stage.name}`} onClick={() => setEditing(true)} disabled={pending}>
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
            </IconButton>
            {blockedBy === null ? (
              <IconButton
                label={`Delete ${stage.name}`}
                onClick={() => setConfirming(true)}
                disabled={pending}
                danger
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </IconButton>
            ) : (
              <span className="ml-1 text-xs whitespace-nowrap text-gray-400">{blockedBy}</span>
            )}
          </span>
        )}

        {terminal && canManage && (
          <span className="shrink-0 text-xs text-gray-400">
            closing stage — deals get their won/lost status through it
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {confirming && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: "auto" }}
            exit={{ opacity: 0, scale: 0.96, height: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2.5">
              <p className="text-sm text-gray-700">
                Delete <span className="font-semibold">{stage.name}</span>? Nothing points at it.
              </p>
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="min-h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false);
                    onDelete();
                  }}
                  disabled={pending}
                  className="min-h-8 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
                >
                  Delete stage
                </button>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-30 " +
        (danger
          ? "text-gray-400 hover:bg-rose-50 hover:text-rose-600"
          : "text-gray-400 hover:bg-brand-100/70 hover:text-gray-700")
      }
    >
      {children}
    </button>
  );
}

/**
 * "+ Add stage": a name and where it goes. Position is never typed — the
 * choice is "after which stage" (or the start), and the number is computed
 * server-side as the midpoint of the gap. That is what the 10-step grid is
 * for: inserting between 30 and 40 writes 35 and moves nobody.
 */
function AddStage({
  working,
  pending,
  onCreate,
}: {
  working: StageAdminRow[];
  pending: boolean;
  onCreate: (name: string, afterId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  // Default to the end of the working pipeline — the common case for a new
  // step — which is "after the last working stage".
  const [afterId, setAfterId] = useState<string>(working[working.length - 1]?.id ?? "start");

  function submit() {
    if (!name.trim()) return;
    onCreate(name.trim(), afterId === "start" ? null : afterId);
    setName("");
    setOpen(false);
  }

  return (
    <div className="mt-4">
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.button
            key="trigger"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 text-xs font-semibold text-white shadow-sm shadow-brand-500/25 transition-colors hover:bg-brand-600"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Add stage
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-3 rounded-2xl border border-brand-200/60 bg-brand-50/30 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  autoFocus
                  placeholder="Legal review"
                  className={FIELD_CLASS}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Insert</span>
                <select
                  value={afterId}
                  onChange={(e) => setAfterId(e.target.value)}
                  className={FIELD_CLASS}
                >
                  <option value="start">At the start</option>
                  {working.map((s) => (
                    <option key={s.id} value={s.id}>
                      After {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-9 items-center rounded-xl px-3 text-sm font-medium text-gray-500 transition-colors hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || !name.trim()}
                className="inline-flex min-h-9 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Adding…" : "Add stage"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
