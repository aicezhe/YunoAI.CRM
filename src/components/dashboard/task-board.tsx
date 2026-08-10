"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Sun } from "lucide-react";
import { ActivityIcon } from "@/components/ui/badges";
import { setActivityDone } from "@/lib/data/actions";
import { formatRelativeDay, formatTime } from "@/lib/format";
import type { CompletedToday } from "@/lib/data/activities";
import type { ActivityRow, ActivityType } from "@/lib/data/types";

const TYPE_ORDER: ActivityType[] = ["call", "meeting", "email", "task", "note"];
const TYPE_PLURAL: Record<ActivityType, string> = {
  call: "calls",
  meeting: "meetings",
  email: "emails",
  task: "tasks",
  note: "notes",
};

/** Where the row points, and who it is with. Deal first: on the dashboard
 *  the question is "which deal is this moving", not "who is this person".
 *
 *  `?from=dashboard` marks the destination record's BackLink (see
 *  resolveBack in components/ui/record.tsx) so it returns here instead of
 *  the deal/contact's own list, which the dashboard has no tab for anyway. */
function resolveContext(task: ActivityRow): { label: string; href: string } {
  if (task.dealId) {
    const who = task.personName ?? task.organizationName;
    return {
      label: who ? `${task.dealTitle} · ${who}` : (task.dealTitle ?? "Deal"),
      href: `/deals/${task.dealId}?from=dashboard`,
    };
  }
  if (task.personId)
    return {
      label: task.personName ?? "Contact",
      href: `/contacts/people/${task.personId}?from=dashboard`,
    };
  return {
    label: task.organizationName ?? "Organization",
    href: `/contacts/organizations/${task.organizationId}?from=dashboard`,
  };
}

function statusPhrase(remaining: number, overdueCount: number): string {
  if (remaining === 0) return "You're all clear for today.";
  const tasks = `${remaining} ${remaining === 1 ? "task" : "tasks"} today`;
  return overdueCount > 0 ? `${tasks}, ${overdueCount} overdue.` : `${tasks}.`;
}

function completedCaption(counts: CompletedToday): string | null {
  const parts = TYPE_ORDER.filter((t) => (counts[t] ?? 0) > 0).map((t) => {
    const n = counts[t]!;
    return `${n} ${n === 1 ? t : TYPE_PLURAL[t]}`;
  });
  if (parts.length === 0) return null;
  return `Today: ${parts.join(", ")} completed.`;
}

/**
 * Everything below the "Hi, {name}" heading: the one-line status, the
 * overdue strip, and the day's task list — one client component so ticking
 * the last box can settle into the all-clear state in place, instead of a
 * server round-trip swapping the whole section at once.
 */
export function TaskBoard({
  overdue,
  initialToday,
  initialCompletedToday,
}: {
  overdue: ActivityRow[];
  initialToday: ActivityRow[];
  initialCompletedToday: CompletedToday;
}) {
  const [today, setToday] = useState(initialToday);
  const [completedToday, setCompletedToday] = useState(initialCompletedToday);
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const remaining = overdue.length + today.length;

  function handleComplete(task: ActivityRow) {
    setLeavingIds((prev) => new Set(prev).add(task.id));
    setCompletedToday((prev) => ({ ...prev, [task.type]: (prev[task.type] ?? 0) + 1 }));

    startTransition(async () => {
      try {
        await setActivityDone(task.id, true);
      } catch {
        // Roll back the count and let the row settle back to normal. It may
        // already have been spliced out by its own exit transition finishing
        // before this rejection arrived — put it back, sorted into place by
        // time, if so.
        setLeavingIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
        setCompletedToday((prev) => ({
          ...prev,
          [task.type]: Math.max(0, (prev[task.type] ?? 0) - 1),
        }));
        setToday((prev) =>
          prev.some((t) => t.id === task.id)
            ? prev
            : [...prev, task].sort(
                (a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime(),
              ),
        );
      }
    });
  }

  function handleLeaveEnd(id: string) {
    // A row whose server call already failed and rolled back is no longer
    // "leaving" by the time its faded-out frame fires — nothing to remove.
    setLeavingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setToday((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      <p className="enter mt-2 text-base text-gray-500" style={delayStyle(60)}>
        {statusPhrase(remaining, overdue.length)}
      </p>

      <div className="mt-8 space-y-4">
        {overdue.length > 0 && (
          <div className="enter" style={delayStyle(120)}>
            <OverdueStrip overdue={overdue} />
          </div>
        )}

        {today.length > 0 ? (
          <section
            className="enter rounded-3xl border border-brand-200/70 bg-white p-2 shadow-sm sm:p-3"
            style={delayStyle(180)}
          >
            <ul>
              {today.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  leaving={leavingIds.has(task.id)}
                  onComplete={handleComplete}
                  onLeaveEnd={handleLeaveEnd}
                />
              ))}
            </ul>
          </section>
        ) : (
          <AllClearCard completedToday={completedToday} />
        )}
      </div>
    </>
  );
}

function delayStyle(ms: number): React.CSSProperties {
  return { "--enter-delay": `${ms}ms` } as React.CSSProperties;
}

/** A narrow strip, not a card: late work gets one line of interruption above
 *  the plan for today, not a section of its own. Always previews the most
 *  overdue item — the query sorts ascending, so that is always index 0. */
function OverdueStrip({ overdue }: { overdue: ActivityRow[] }) {
  const first = overdue[0];
  const { href } = resolveContext(first);

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2.5 text-sm text-rose-700 transition hover:bg-rose-100/70"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" strokeWidth={2} aria-hidden />
      <span className="min-w-0 truncate">
        <span className="font-semibold">
          {overdue.length} overdue {overdue.length === 1 ? "task" : "tasks"}
        </span>
        <span aria-hidden> — </span>
        {first.subject}, {formatRelativeDay(first.dueAt!)}
      </span>
    </Link>
  );
}

/**
 * One row of today's work. Deliberately taller and larger-typed than a table
 * row — this is the block the screen is built around.
 *
 * The checkbox fills in immediately on click (clear confirmation that the
 * tap registered) while the row itself fades and shrinks over 200ms; the
 * parent removes it from the list only once that transition actually ends,
 * so the animation always gets to finish.
 */
function TaskRow({
  task,
  leaving,
  onComplete,
  onLeaveEnd,
}: {
  task: ActivityRow;
  leaving: boolean;
  onComplete: (task: ActivityRow) => void;
  onLeaveEnd: (id: string) => void;
}) {
  const { label, href } = resolveContext(task);

  return (
    <li
      className={
        "relative flex items-center gap-3 rounded-2xl px-3 py-3.5 transition-all duration-200 ease-in sm:gap-4 sm:px-4 " +
        (leaving
          ? "pointer-events-none -translate-x-1 scale-[0.98] opacity-0"
          : "opacity-100 hover:bg-brand-100/60")
      }
      onTransitionEnd={(e) => {
        if (leaving && e.propertyName === "opacity") onLeaveEnd(task.id);
      }}
    >
      <ActivityIcon type={task.type} />

      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="font-medium text-gray-900 after:absolute after:inset-0 after:content-[''] hover:text-brand-600"
        >
          {task.subject}
        </Link>

        {/* On a phone the time joins the context line instead of taking a
            column of its own: three columns at 375px squeezes the subject
            into wrapped lines and the row loses its shape. */}
        <p className="truncate text-sm text-gray-500">
          <span className="sm:hidden">
            {formatTime(task.dueAt!)}
            <span aria-hidden> · </span>
          </span>
          {label}
        </p>
      </div>

      <span className="hidden shrink-0 text-sm tabular-nums text-gray-500 sm:inline">
        {formatTime(task.dueAt!)}
      </span>

      <button
        type="button"
        role="checkbox"
        aria-checked={leaving}
        aria-label={`Mark "${task.subject}" as done`}
        onClick={() => !leaving && onComplete(task)}
        className={
          "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors " +
          (leaving
            ? "border-brand-500 bg-brand-500 text-white"
            : "border-gray-300 bg-white text-transparent hover:border-brand-500")
        }
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
      </button>
    </li>
  );
}

/** The empty state and the "just finished" state are the same screen: a
 *  positive resting point, not a blank void. The caption only appears once
 *  something has actually been completed today, whether that happened this
 *  session or before the page ever loaded. */
function AllClearCard({ completedToday }: { completedToday: CompletedToday }) {
  const caption = completedCaption(completedToday);

  return (
    <section className="enter flex flex-col items-center rounded-3xl border border-brand-200/70 bg-white px-6 py-16 text-center shadow-sm">
      <span className="rise-in flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-500">
        <Sun className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="mt-5 text-base font-semibold text-gray-900">You&apos;re all clear for today</h2>
      {caption && <p className="mt-1.5 text-sm text-gray-500">{caption}</p>}
    </section>
  );
}
