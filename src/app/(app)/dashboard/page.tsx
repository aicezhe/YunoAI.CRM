import Link from "next/link";
import { Sun } from "lucide-react";
import { OverdueGroup, TaskRow } from "@/components/dashboard/task-list";
import { ErrorState } from "@/components/ui/states";
import { getTodayBoard } from "@/lib/data/activities";
import { getPipelineSummary } from "@/lib/data/deals";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatMoney } from "@/lib/format";

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
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Hi, {name}</h1>
        <div className="mt-8">
          <ErrorState message={board.error} />
        </div>
      </main>
    );
  }

  const { overdue, today } = board.data;
  const outstanding = overdue.length + today.length;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <header>
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
        <OverdueGroup tasks={overdue} />

        {today.length > 0 && (
          <section className="rounded-3xl border border-brand-200/70 bg-white p-2 shadow-sm sm:p-3">
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
          <section className="flex flex-col items-center rounded-3xl border border-brand-200/70 bg-white px-6 py-16 text-center shadow-sm">
            <span className="rise-in flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-500">
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

      <ContextLine summary={summary} />
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
function ContextLine({ summary }: { summary: Awaited<ReturnType<typeof getPipelineSummary>> }) {
  if (!summary.ok) return null;

  const { openCount, openValue, staleCount } = summary.data;
  if (openCount === 0) return null;

  const link = "underline decoration-gray-300 underline-offset-2 transition hover:text-brand-600";

  return (
    <p className="mt-10 text-sm text-gray-400">
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
