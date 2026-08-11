"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, RotateCcw, X } from "lucide-react";
import { updateDealStage } from "@/lib/data/actions/deals";
import type { DealStatus } from "@/lib/data/types";

type Stage = { id: string; name: string };

/** Won and Lost live in pipeline_stages alongside the real steps (see
 *  0011_seed_pipeline_stages.sql), but they are outcomes, not places on the
 *  path — so they never appear as segments in the chain. */
const TERMINAL = ["Won", "Lost"];

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * The deal's position on the pipeline, as a path rather than a list.
 *
 * Replaces the stage badge + dropdown entirely: a dropdown shows seven
 * equal options and says nothing about order or progress, which is the one
 * thing a pipeline stage actually means. Each segment is a real button, so
 * moving the deal is a single click on where it should be rather than
 * open-menu-then-pick.
 *
 * Won and Lost sit apart from the chain, on the right, because they end the
 * path instead of continuing it. Once a deal is closed the whole strip
 * becomes a single closed banner — a finished deal should not read as one
 * still moving through stages.
 */
export function StageStepper({
  dealId,
  stages,
  initialStageId,
  initialStageName,
  initialStatus,
  initialLostReason,
}: {
  dealId: string;
  stages: Stage[];
  initialStageId: string | null;
  initialStageName: string | null;
  initialStatus: DealStatus;
  initialLostReason: string | null;
}) {
  const [current, setCurrent] = useState({
    id: initialStageId,
    name: initialStageName,
    status: initialStatus,
    lostReason: initialLostReason,
  });
  const [lostPrompt, setLostPrompt] = useState<Stage | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Lets a closed deal show the chain again so a stage can be picked; the
  // reopen only actually happens once one is.
  const [reopening, setReopening] = useState(false);
  const [pending, startTransition] = useTransition();
  const promptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lostPrompt) return;
    function onClickOutside(e: MouseEvent) {
      if (promptRef.current && !promptRef.current.contains(e.target as Node)) {
        setLostPrompt(null);
        setLostReason("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [lostPrompt]);

  const path = stages.filter((s) => !TERMINAL.includes(s.name));
  const won = stages.find((s) => s.name === "Won");
  const lost = stages.find((s) => s.name === "Lost");

  const currentIndex = path.findIndex((s) => s.id === current.id);
  const closed = current.status !== "open";

  function commit(stage: Stage, reason: string | null) {
    const previous = current;
    setCurrent({
      id: stage.id,
      name: stage.name,
      status: stage.name === "Won" ? "won" : stage.name === "Lost" ? "lost" : "open",
      lostReason: reason,
    });
    setLostPrompt(null);
    setReopening(false);
    setError(null);

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

  // A closed deal collapses the path into one banner — unless the user asked
  // to reopen it, which puts the chain back so a stage can be chosen.
  if (closed && !reopening) {
    return (
      <div className="mt-5">
        <ClosedBanner
          status={current.status}
          lostReason={current.lostReason}
          onReopen={() => setReopening(true)}
        />
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        {/* basis-full below sm: with flex-1 alone the bar just shrank to
            share the row with the two outcome buttons, squeezing five
            segments into a third of a phone screen. Full width forces them
            onto their own line instead. */}
        <ol className="flex w-full min-w-0 basis-full items-center gap-1.5 sm:w-auto sm:flex-1 sm:basis-auto">
          {path.map((stage, i) => {
            const passed = currentIndex >= 0 && i < currentIndex;
            const isCurrent = stage.id === current.id;
            const filled = passed || isCurrent;

            return (
              <li key={stage.id} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => stage.id !== current.id && commit(stage, null)}
                  disabled={pending}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Move to ${stage.name} (step ${i + 1} of ${path.length})`}
                  className="group block w-full text-left disabled:cursor-not-allowed"
                >
                  {/* The track. The fill is a separate layer so it can grow
                      from the left rather than the whole bar cross-fading. */}
                  <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-brand-150 transition-colors group-hover:bg-brand-200">
                    <motion.span
                      initial={false}
                      animate={{ scaleX: filled ? 1 : 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      style={{ originX: 0 }}
                      className={`absolute inset-0 rounded-full ${
                        isCurrent ? "bg-brand-500" : "bg-brand-500/55"
                      }`}
                    />
                  </span>

                  {/* Labels are the affordance on desktop, so no tooltip
                      duplicating them; below sm the row collapses to the
                      single "current stage · step n of m" line underneath. */}
                  <span
                    className={
                      "mt-2 hidden truncate text-xs transition-colors sm:block " +
                      (isCurrent
                        ? "font-semibold text-brand-600"
                        : passed
                          ? "text-gray-500 group-hover:text-brand-600"
                          : "text-gray-400 group-hover:text-brand-600")
                    }
                  >
                    {stage.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="relative flex shrink-0 items-center gap-2" ref={promptRef}>
          {won && (
            <button
              type="button"
              onClick={() => commit(won, null)}
              disabled={pending}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Mark as won
            </button>
          )}
          {lost && (
            <button
              type="button"
              onClick={() => setLostPrompt(lostPrompt ? null : lost)}
              disabled={pending}
              aria-expanded={lostPrompt !== null}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Mark as lost
            </button>
          )}

          <AnimatePresence>
            {lostPrompt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                // Leaving is quicker than arriving — a dismissed panel should
                // get out of the way, not perform.
                exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.1, ease: EASE } }}
                transition={{ duration: 0.15, ease: EASE }}
                style={{ originX: 1, originY: 0 }}
                className="absolute top-full right-0 z-30 mt-2 w-72 rounded-2xl border border-brand-200/70 bg-white p-3 shadow-xl shadow-brand-500/10"
              >
                <label
                  htmlFor="lost-reason"
                  className="mb-1.5 block text-xs font-medium text-gray-500"
                >
                  Why was this deal lost?
                </label>
                <textarea
                  id="lost-reason"
                  autoFocus
                  rows={3}
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="Budget cut, went with a competitor…"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLostPrompt(null);
                      setLostReason("");
                    }}
                    className="rounded-xl px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!lostReason.trim()}
                    onClick={() => commit(lostPrompt, lostReason.trim())}
                    className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Mark lost
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* The whole label row, compressed to one line below sm. */}
      <p className="mt-2 text-xs text-gray-500 sm:hidden">
        <span className="font-semibold text-brand-600">{current.name ?? "No stage"}</span>
        {currentIndex >= 0 && (
          <span className="text-gray-400">
            {" · "}step {currentIndex + 1} of {path.length}
          </span>
        )}
      </p>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

/** A closed deal, as one strip rather than a path — plus the way back. */
function ClosedBanner({
  status,
  lostReason,
  onReopen,
}: {
  status: DealStatus;
  lostReason: string | null;
  onReopen: () => void;
}) {
  const isWon = status === "won";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      className={
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border px-4 py-3 " +
        (isWon ? "border-emerald-200 bg-emerald-50/70" : "border-rose-200 bg-rose-50/60")
      }
    >
      <span
        className={
          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full " +
          (isWon ? "bg-emerald-600 text-white" : "bg-rose-500/90 text-white")
        }
      >
        {isWon ? (
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        ) : (
          <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        )}
      </span>

      <span className={`text-sm font-semibold ${isWon ? "text-emerald-800" : "text-rose-800"}`}>
        {isWon ? "Won" : "Lost"}
      </span>

      {!isWon && lostReason && (
        <span className="min-w-0 flex-1 truncate text-sm text-rose-700/80">{lostReason}</span>
      )}

      <button
        type="button"
        onClick={onReopen}
        className={
          "ml-auto inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors " +
          (isWon
            ? "text-emerald-700 hover:bg-emerald-100"
            : "text-rose-700 hover:bg-rose-100")
        }
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Reopen
      </button>
    </motion.div>
  );
}
