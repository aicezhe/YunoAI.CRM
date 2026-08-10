import { notFound } from "next/navigation";
import { DealActivityCard } from "@/components/deals/deal-activity-card";
import { StagePicker } from "@/components/deals/stage-picker";
import { BackLink, Field, Missing, RecordCard, resolveBack } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { listActivitiesForDeal } from "@/lib/data/activities";
import { getDeal, listStages, listStageTransitions } from "@/lib/data/deals";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export default async function DealPage({ params, searchParams }: PageProps<"/deals/[id]">) {
  const { id } = await params;
  const { from } = await searchParams;
  const [deal, activities, stages, transitions] = await Promise.all([
    getDeal(id),
    listActivitiesForDeal(id),
    listStages(),
    listStageTransitions(id),
  ]);

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
          first, then each card a beat behind it. See RecordCard.
          relative z-10: .enter animates transform, which gives this row its
          own stacking context — without an explicit z-index it still loses
          to the RecordCards below in DOM-order stacking, trapping the stage
          dropdown behind them. */}
      <div className="enter relative z-10 mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          {d.title}
        </h1>
        <StagePicker
          dealId={d.id}
          stages={stages.ok ? stages.data : []}
          initialStageId={d.stageId}
          initialStageName={d.stageName}
        />
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

        <DealActivityCard
          dealId={d.id}
          personId={d.personId}
          orgId={d.organizationId}
          activities={activities}
        />

        <RecordCard title="Stage history" index={2}>
          {!transitions.ok ? (
            <p className="py-4 text-sm text-gray-500">{transitions.error}</p>
          ) : transitions.data.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">No stage changes recorded yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-brand-200/40">
              {transitions.data.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3">
                  <p className="text-sm text-gray-900">
                    {t.fromStageName ?? <Missing />}
                    <span className="mx-1.5 text-gray-400" aria-hidden>
                      →
                    </span>
                    {t.toStageName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t.changedByName ?? "Unknown"} · {formatDate(t.occurredAt)}, {formatTime(t.occurredAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </RecordCard>
      </div>
    </main>
  );
}
