"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { updateDealStage } from "@/lib/data/actions";
import type { DealStatus } from "@/lib/data/types";

type Stage = { id: string; name: string };

function statusFor(stageName: string | null): DealStatus {
  if (stageName === "Won") return "won";
  if (stageName === "Lost") return "lost";
  return "open";
}

/**
 * The deal header's stage badge, made clickable — the one control this page
 * was missing entirely. Doubles as the Won/Lost status badge (deals.status
 * has no board position of its own; Won and Lost are stages like any other,
 * see updateDealStage), so the colour swaps with whichever the deal is
 * currently in rather than staying lavender once it closes.
 *
 * Optimistic, same shape as DoneCheckbox elsewhere: the badge updates the
 * instant a stage is picked and only rolls back if the write actually fails.
 */
export function StagePicker({
  dealId,
  stages,
  initialStageId,
  initialStageName,
}: {
  dealId: string;
  stages: Stage[];
  initialStageId: string | null;
  initialStageName: string | null;
}) {
  const [current, setCurrent] = useState({ id: initialStageId, name: initialStageName });
  const [open, setOpen] = useState(false);
  const [lostPrompt, setLostPrompt] = useState<Stage | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setLostPrompt(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function pick(stage: Stage) {
    if (stage.id === current.id) {
      setOpen(false);
      return;
    }
    setError(null);
    if (stage.name === "Lost") {
      setLostPrompt(stage);
      return;
    }
    commit(stage, null);
  }

  function commit(stage: Stage, reason: string | null) {
    const previous = current;
    setCurrent({ id: stage.id, name: stage.name });
    setOpen(false);
    setLostPrompt(null);
    startTransition(async () => {
      const result = await updateDealStage(dealId, stage.id, reason);
      if (result.error) {
        setCurrent(previous);
        setError(result.error);
        return;
      }
      setLostReason("");
    });
  }

  const status = statusFor(current.name);
  const colors =
    status === "won"
      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : status === "lost"
        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
        : "bg-brand-100 text-brand-600 hover:bg-brand-200/70";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${colors}`}
      >
        {status === "won" && <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />}
        {status === "lost" && <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />}
        {current.name ?? "No stage"}
        <ChevronDown className="h-3 w-3" strokeWidth={2.5} aria-hidden />
      </button>

      {error && <p className="mt-1.5 max-w-56 text-right text-xs text-red-500">{error}</p>}

      {open && (
        // left-0 below md: the header row wraps there and the trigger sits
        // flush against the page's own left edge, so right-0's anchor (fine
        // once the trigger is at the far right of an unwrapped header) would
        // push the panel off the left side of the screen.
        <div className="absolute left-0 z-20 mt-2 w-64 rounded-2xl border border-brand-200/70 bg-white p-1.5 shadow-lg md:right-0 md:left-auto">
          {lostPrompt ? (
            <div className="p-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                Why was this deal lost?
              </label>
              <textarea
                autoFocus
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                placeholder="Budget cut, went with a competitor…"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLostPrompt(null);
                    setLostReason("");
                  }}
                  className="rounded-xl px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!lostReason.trim()}
                  onClick={() => commit(lostPrompt, lostReason.trim())}
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mark lost
                </button>
              </div>
            </div>
          ) : (
            <ul role="menu">
              {stages.map((stage) => (
                <li key={stage.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => pick(stage)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-brand-100/60"
                  >
                    {stage.name}
                    {stage.id === current.id && (
                      <Check className="h-3.5 w-3.5 text-brand-500" strokeWidth={2.5} aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
