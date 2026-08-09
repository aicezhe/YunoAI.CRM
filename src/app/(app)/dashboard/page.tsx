import Link from "next/link";
import { Sun } from "lucide-react";
import { OverdueGroup, TaskRow } from "@/components/dashboard/task-list";
import { CARD_STAGGER_MS } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { getTodayBoard } from "@/lib/data/activities";
import { getPipelineSummary } from "@/lib/data/deals";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatMoney } from "@/lib/format";

/** `n`th content block after the greeting settles a beat behind it — same
 *  rhythm every record page uses (see RecordCard), applied here by hand
 *  because the dashboard's blocks are conditional rather than a fixed list. */
function blockDelay(n: number): React.CSSProperties {
  return { "--enter-delay": `${(n + 1) * CARD_STAGGER_MS}ms` } as React.CSSProperties;
}

export const metadata = { title: "Dashboard · YunoCRM" };

/**
 * The dashboard answers "what do I start with today", not "how was the
 * quarter".
 *
 * So it has one focus — the list of work owed today — and everything else is
 * one line of small text at the bottom. The alternative shape, four equal
 * metric cards, forces the reader to pick which number matters before they
 * can act, and the answer is always the same: none of them, the tasks do.
 *
 * The size gap between the two is the whole design. Large means do it now,
 * small means be aware of it.
 */
export default async function DashboardPage() {
  // Independent queries, so they overlap rather than queue.
  const [user, board, summary] = await Promise.all([
    getCurrentUser(),
    getTodayBoard(),
    getPipelineSummary(),
  ]);

  const name = user?.name ?? "there";

  if (!board.ok) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="enter text-3xl font-semibold tracking-tight text-gray-900">Hi, {name}</h1>
        <div className="mt-8">
          <ErrorState message={board.error} />
        </div>
      </main>
    );
  }

  const { overdue, today } = board.data;
  const outstanding = overdue.length + today.length;

  // Counts only the blocks that actually render, so "today" still lands on
  // the first beat (90ms) when there is no overdue group ahead of it, rather
  // than always waiting for a slot that stayed empty.
  let block = 0;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      {/* The greeting settles in on its own at delay 0; everything below
          follows a beat behind it, in reading order. See `.enter` in
          globals.css and blockDelay() above. */}
      <header className="enter">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          Hi, {name}
        </h1>
        <p className="mt-2 text-base text-gray-500">
          {outstanding === 0
            ? "You're all clear for today."
            : `${outstanding} ${outstanding === 1 ? "task" : "tasks"} for today.`}
        </p>
      </header>

      <div className="mt-8 space-y-4">
        {overdue.length > 0 && (
          <div className="enter" style={blockDelay(block++)}>
            <OverdueGroup tasks={overdue} />
          </div>
        )}

        {today.length > 0 && (
          <section
            className="enter rounded-3xl border border-brand-200/70 bg-white p-2 shadow-sm sm:p-3"
            style={blockDelay(block++)}
          >
            <ul>
              {today.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </ul>
          </section>
        )}

        {outstanding === 0 && (
          // Positive, not a void: an empty day is the goal, and the screen
          // should read as finished rather than broken.
          <section
            className="enter flex flex-col items-center rounded-3xl border border-brand-200/70 bg-white px-6 py-16 text-center shadow-sm"
            style={blockDelay(block++)}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-500">
              <Sun className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 className="mt-5 text-base font-semibold text-gray-900">Nothing due today</h2>
            <p className="mt-1.5 max-w-sm text-sm text-gray-500">
              No calls, meetings or tasks are owed. Anything you schedule with a due date shows up
              here.
            </p>
            <Link
              href="/activities"
              className="mt-6 inline-flex min-h-10 items-center rounded-2xl border border-brand-200 bg-brand-50 px-4 text-sm font-medium text-brand-600 transition hover:bg-brand-100"
            >
              See all activities
            </Link>
          </section>
        )}
      </div>

      <ContextLine summary={summary} delay={blockDelay(block)} />
    </main>
  );
}

/**
 * Secondary context — one line, small, at the bottom.
 *
 * One line rather than cards, on purpose: as soon as these become boxes they
 * compete with the task list, and the screen goes back to being a report.
 * Every fragment is a link into the section that explains it.
 */
function ContextLine({
  summary,
  delay,
}: {
  summary: Awaited<ReturnType<typeof getPipelineSummary>>;
  delay: React.CSSProperties;
}) {
  if (!summary.ok) return null;

  const { openCount, openValue, staleCount } = summary.data;
  if (openCount === 0) return null;

  const link = "underline decoration-gray-300 underline-offset-2 transition hover:text-brand-600";

  return (
    <p className="enter mt-10 text-sm text-gray-400" style={delay}>
      <Link href="/deals" className={link}>
        {openCount} {openCount === 1 ? "deal" : "deals"} in progress
      </Link>
      {staleCount > 0 && (
        <>
          <span aria-hidden> · </span>
          <Link href="/deals" className={link}>
            {staleCount} with no activity for over a week
          </Link>
        </>
      )}
      <span aria-hidden> · </span>
      <Link href="/deals" className={link}>
        {formatMoney(openValue)} in pipeline
      </Link>
    </p>
  );
}
