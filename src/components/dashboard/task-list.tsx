import Link from "next/link";
import { DoneCheckbox } from "@/components/done-checkbox";
import { ActivityIcon } from "@/components/ui/badges";
import type { ActivityRow } from "@/lib/data/types";
import { formatOverdueBy, formatTime } from "@/lib/format";

/** Where the row points, and who it is with. Deal first: on the dashboard
 *  the question is "which deal is this moving", not "who is this person". */
function context(task: ActivityRow): { label: string; href: string } {
  if (task.dealId) {
    const who = task.personName ?? task.organizationName;
    return {
      label: who ? `${task.dealTitle} · ${who}` : (task.dealTitle ?? "Deal"),
      href: `/deals/${task.dealId}`,
    };
  }
  if (task.personId)
    return { label: task.personName ?? "Contact", href: `/contacts/people/${task.personId}` };
  return {
    label: task.organizationName ?? "Organization",
    href: `/contacts/organizations/${task.organizationId}`,
  };
}

/**
 * One row of today's work.
 *
 * Deliberately taller and larger-typed than a table row. This is the block
 * the screen is built around, and the size difference against the context
 * line at the bottom is what makes the hierarchy readable in a glance rather
 * than after reading.
 */
export function TaskRow({ task, overdue = false }: { task: ActivityRow; overdue?: boolean }) {
  const { label, href } = context(task);
  const when = overdue ? formatOverdueBy(task.dueAt!) : formatTime(task.dueAt!);

  return (
    <li className="relative flex items-center gap-3 rounded-2xl px-3 py-3.5 transition-colors hover:bg-brand-100/60 sm:gap-4 sm:px-4">
      <ActivityIcon type={task.type} />

      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="font-medium text-gray-900 after:absolute after:inset-0 after:content-[''] hover:text-brand-600"
        >
          {task.subject}
        </Link>

        {/* On a phone the time joins the context line instead of taking a
            column of its own: three columns on 375px squeezed the subject
            into three wrapped lines and the row lost its shape. */}
        <p className="truncate text-sm text-gray-500">
          <span className={`sm:hidden ${overdue ? "font-medium text-rose-600" : ""}`}>
            {when}
            <span aria-hidden> · </span>
          </span>
          {label}
        </p>
      </div>

      <span
        className={
          "hidden shrink-0 text-sm tabular-nums sm:inline " +
          (overdue ? "font-medium text-rose-600" : "text-gray-500")
        }
      >
        {when}
      </span>

      <DoneCheckbox id={task.id} done={task.done} label={task.subject} />
    </li>
  );
}

/** The overdue group. Rose, and above today's list — late work is the one
 *  thing that should interrupt the plan for the day. */
export function OverdueGroup({ tasks }: { tasks: ActivityRow[] }) {
  if (tasks.length === 0) return null;

  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50/50 p-2 sm:p-3">
      <h2 className="px-2 pt-1.5 pb-1 text-xs font-semibold tracking-wide text-rose-600 uppercase">
        Overdue · {tasks.length}
      </h2>
      <ul>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} overdue />
        ))}
      </ul>
    </section>
  );
}
