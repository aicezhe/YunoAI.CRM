import Link from "next/link";
import { TaskBoard } from "@/components/dashboard/task-board";
import { ErrorState } from "@/components/ui/states";
import { getCompletedTodayByType, getTodayBoard } from "@/lib/data/activities";
import { getPipelineSummary } from "@/lib/data/deals";
import { requireUser } from "@/lib/auth/current-user";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Dashboard · YunoCRM" };

/**
 * The dashboard answers "what do I start with today", not "how was the
 * quarter".
 *
 * So it has one focus — the list of work owed today, for the signed-in
 * person specifically — and everything else is one line of small text at the
 * bottom. The alternative shape, four equal metric cards, forces the reader
 * to pick which number matters before they can act, and the answer is always
 * the same: none of them, the tasks do.
 *
 * Everything from the status line down is one client component (TaskBoard):
 * ticking the last task off has to settle into the all-clear state in place,
 * and that needs local state a server round-trip can't drive.
 */
export default async function DashboardPage() {
  const user = await requireUser();

  // Independent queries, so they overlap rather than queue.
  const [board, completedToday, summary] = await Promise.all([
    getTodayBoard(user.id),
    getCompletedTodayByType(user.id),
    getPipelineSummary(),
  ]);

  if (!board.ok) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="enter text-3xl font-semibold tracking-tight text-gray-900">Hi, {user.name}</h1>
        <div className="mt-8">
          <ErrorState message={board.error} />
        </div>
      </main>
    );
  }

  const { overdue, today } = board.data;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <h1 className="enter text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
        Hi, {user.name}
      </h1>

      <TaskBoard
        overdue={overdue}
        initialToday={today}
        // A failed count degrades to zero rather than taking the page down —
        // it only ever feeds an optional caption, never the list itself.
        initialCompletedToday={completedToday.ok ? completedToday.data : {}}
      />

      <ContextLine summary={summary} />
    </main>
  );
}

/**
 * Secondary context — one line, small, at the bottom, in one order: how much
 * is in motion, what it's worth, then what's gone quiet.
 *
 * One line rather than cards, on purpose: as soon as these become boxes they
 * compete with the task list, and the screen goes back to being a report.
 * Every fragment is a link into the section that explains it. Stays put
 * through the task list's own state changes — it lives in the server-rendered
 * shell around TaskBoard, not inside it.
 */
function ContextLine({ summary }: { summary: Awaited<ReturnType<typeof getPipelineSummary>> }) {
  if (!summary.ok) return null;

  const { openCount, openValue, staleCount } = summary.data;
  if (openCount === 0) return null;

  const link = "underline decoration-gray-300 underline-offset-2 transition hover:text-brand-600";

  return (
    <p
      className="enter mt-10 text-sm text-gray-400"
      style={{ "--enter-delay": "260ms" } as React.CSSProperties}
    >
      <Link href="/deals" className={link}>
        {openCount} {openCount === 1 ? "deal" : "deals"} in progress
      </Link>
      <span aria-hidden> · </span>
      <Link href="/deals" className={link}>
        {formatMoney(openValue)} in pipeline
      </Link>
      {staleCount > 0 && (
        <>
          <span aria-hidden> · </span>
          <Link href="/deals" className={link}>
            {staleCount} with no activity for over a week
          </Link>
        </>
      )}
    </p>
  );
}
