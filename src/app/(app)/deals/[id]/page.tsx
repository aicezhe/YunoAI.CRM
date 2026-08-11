import Link from "next/link";
import { notFound } from "next/navigation";
import { DealActivityCard } from "@/components/deals/deal-activity-card";
import { DealContractsCard } from "@/components/deals/deal-contracts-card";
import { StageStepper } from "@/components/deals/stage-stepper";
import { Pencil, Route } from "lucide-react";
import { BackLink, Field, Missing, RecordCard } from "@/components/ui/record";
import { FlipScene } from "@/components/ui/flip-scene";
import { ErrorState, InlineEmpty } from "@/components/ui/states";
import { listActivitiesForDeal } from "@/lib/data/activities";
import { listContractsForDeal } from "@/lib/data/contracts";
import { getDeal, listStages, listStageTransitions } from "@/lib/data/deals";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export default async function DealPage({ params }: PageProps<"/deals/[id]">) {
  const { id } = await params;
  const [deal, activities, stages, transitions, contracts] = await Promise.all([
    getDeal(id),
    listActivitiesForDeal(id),
    listStages(),
    listStageTransitions(id),
    listContractsForDeal(id),
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
  return (
    <FlipScene>
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href="/deals" label="Deals" />

      {/* Staggered arrival, same rhythm as every other record page — heading
          first, then each card a beat behind it. See RecordCard.
          relative z-10: .enter animates transform, which gives this block its
          own stacking context — without an explicit z-index it still loses
          to the RecordCards below in DOM-order stacking, trapping the
          stepper's lost-reason popover behind them. */}
      <div className="enter relative z-10 mt-4">
        {/* Edit sits beside the title, matching the contact and organization
            records. The stepper below stays the fast path for the one change
            people make constantly; this is for everything else. */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {d.title}
          </h1>
          <Link
            href={`/deals/${id}/edit`}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-medium text-brand-600 transition hover:bg-brand-100"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Edit
          </Link>
        </div>
        <StageStepper
          dealId={d.id}
          stages={stages.ok ? stages.data : []}
          initialStageId={d.stageId}
          initialStageName={d.stageName}
          initialStatus={d.status}
          initialLostReason={d.lostReason}
        />
      </div>

      <div className="mt-8 space-y-6">
        <RecordCard index={0}>
          <dl>
            <Field label="Value">{formatMoney(d.value, d.currency)}</Field>
            <Field label="Organization">{d.organizationName ?? <Missing />}</Field>
            <Field label="Contact">{d.personName ?? <Missing />}</Field>
            <Field label="Owner">{d.ownerName ?? <Missing />}</Field>
            <Field label="Expected close">{formatDate(d.expectedCloseDate)}</Field>
          </dl>
        </RecordCard>

        {/* Directly under the fields, above the activity feed: after a win
            this is the next thing to do, and a prompt below two other cards
            is a prompt nobody scrolls to. */}
        <DealContractsCard dealId={d.id} status={d.status} contracts={contracts} index={1} />

        <DealActivityCard
          dealId={d.id}
          personId={d.personId}
          orgId={d.organizationId}
          activities={activities}
          index={2}
        />

        <RecordCard title="Stage history" index={3}>
          {!transitions.ok ? (
            <p className="py-4 text-sm text-gray-500">{transitions.error}</p>
          ) : transitions.data.length === 0 ? (
            <InlineEmpty
              icon={Route}
              title="No stage changes recorded yet."
              action={
                <span className="text-sm text-gray-400">
                  Moving this deal along the bar above records the first one.
                </span>
              }
            />
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
  </FlipScene>
  );
}
