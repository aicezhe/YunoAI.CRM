import { notFound } from "next/navigation";
import { DoneCheckbox } from "@/components/done-checkbox";
import { ActivityIcon, StageBadge, StatusBadge } from "@/components/ui/badges";
import { BackLink, Field, Missing, RecordCard, resolveBack } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { listActivitiesForDeal } from "@/lib/data/activities";
import { getDeal } from "@/lib/data/deals";
import { formatDate, formatDue, formatMoney } from "@/lib/format";

export default async function DealPage({ params, searchParams }: PageProps<"/deals/[id]">) {
  const { id } = await params;
  const { from } = await searchParams;
  const [deal, activities] = await Promise.all([getDeal(id), listActivitiesForDeal(id)]);

  if (!deal.ok) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <ErrorState message={deal.error} />
      </main>
    );
  }
  if (!deal.data) notFound();

  const d = deal.data;
  const back = resolveBack(from, { href: "/deals", label: "Deals" });

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href={back.href} label={back.label} />

      {/* Staggered arrival, same rhythm as every other record page — heading
          first, then each card a beat behind it. See RecordCard. */}
      <div className="enter mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          {d.title}
        </h1>
        {d.status === "open" ? <StageBadge name={d.stageName} /> : <StatusBadge status={d.status} />}
      </div>

      <div className="mt-8 space-y-5">
        <RecordCard index={0}>
          <dl>
            <Field label="Value">{formatMoney(d.value, d.currency)}</Field>
            <Field label="Organization">{d.organizationName ?? <Missing />}</Field>
            <Field label="Contact">{d.personName ?? <Missing />}</Field>
            <Field label="Owner">{d.ownerName ?? <Missing />}</Field>
            <Field label="Expected close">{formatDate(d.expectedCloseDate)}</Field>
          </dl>
        </RecordCard>

        <RecordCard title="Activity" index={1}>
          {!activities.ok ? (
            <p className="py-4 text-sm text-gray-500">{activities.error}</p>
          ) : activities.data.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">
              Nothing logged against this deal yet.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-brand-200/40">
              {activities.data.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <ActivityIcon type={a.type} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        "truncate text-sm " +
                        (a.done ? "text-gray-400 line-through" : "text-gray-900")
                      }
                    >
                      {a.subject}
                    </p>
                    <p className="text-xs text-gray-400">{formatDue(a.dueAt)}</p>
                  </div>
                  <DoneCheckbox id={a.id} done={a.done} label={a.subject} />
                </li>
              ))}
            </ul>
          )}
        </RecordCard>
      </div>
    </main>
  );
}
