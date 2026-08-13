import { notFound } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { DoneCheckbox } from "@/components/done-checkbox";
import { ActivityIcon } from "@/components/ui/badges";
import { BackLink, Field, Missing, RecordCard, RecordLink } from "@/components/ui/record";
import { FlipScene } from "@/components/ui/flip-scene";
import { ErrorState } from "@/components/ui/states";
import { getActivity } from "@/lib/data/activities";
import { formatDate, formatTime } from "@/lib/format";

export default async function ActivityPage({ params }: PageProps<"/activities/[id]">) {
  const { id } = await params;
  const activity = await getActivity(id);

  if (!activity.ok) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <ErrorState message={activity.error} />
      </main>
    );
  }
  if (!activity.data) notFound();

  const a = activity.data;

  return (
    <FlipScene>
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href={a.done ? "/activities/archive" : "/activities/open"} label="Activities" />

      <div className="enter mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ActivityIcon type={a.type} />
          <h1
            className={
              "text-2xl font-semibold tracking-tight sm:text-3xl " +
              (a.done ? "text-gray-400 line-through" : "text-gray-900")
            }
          >
            {a.subject}
          </h1>
        </div>
        <DoneCheckbox id={a.id} done={a.done} label={a.subject} />
      </div>

      <div className="mt-8">
        <RecordCard index={0}>
          <dl>
            <Field label="Type">{a.type.charAt(0).toUpperCase() + a.type.slice(1)}</Field>
            <Field label="Priority">
              {a.priority === "urgent" ? (
                <span className="inline-flex items-center gap-1.5 text-amber-600">
                  <CircleAlert className="h-4 w-4 fill-amber-400 text-white" strokeWidth={2.25} aria-hidden />
                  Urgent
                </span>
              ) : (
                <span className="font-normal text-gray-500">Normal</span>
              )}
            </Field>
            <Field label="Due">
              {a.dueAt ? `${formatDate(a.dueAt)}, ${formatTime(a.dueAt)}` : <Missing />}
            </Field>
            <Field label="Deal">
              {a.dealId ? (
                <RecordLink href={`/deals/${a.dealId}`}>
                  {a.dealTitle}
                </RecordLink>
              ) : (
                <Missing />
              )}
            </Field>
            <Field label="Contact">
              {a.personId ? (
                <RecordLink href={`/contacts/people/${a.personId}`}>
                  {a.personName}
                </RecordLink>
              ) : (
                <Missing />
              )}
            </Field>
            <Field label="Organization">
              {a.organizationId ? (
                <RecordLink href={`/contacts/organizations/${a.organizationId}`}>
                  {a.organizationName}
                </RecordLink>
              ) : (
                <Missing />
              )}
            </Field>
          </dl>
        </RecordCard>
      </div>
    </main>
  </FlipScene>
  );
}
