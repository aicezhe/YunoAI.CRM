import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { DeleteRecordButton } from "@/components/contacts/delete-record-button";
import { RelatedActivity, RelatedDeals, RelatedPeople } from "@/components/contacts/related";
import { BackLink, Field, Missing, RecordCard } from "@/components/ui/record";
import { FlipScene } from "@/components/ui/flip-scene";
import { ErrorState } from "@/components/ui/states";
import {
  getOrganization,
  getOrganizationDeleteImpact,
  listPersonsForOrganization,
} from "@/lib/data/contacts";
import { listActivitiesForOrganization } from "@/lib/data/activities";
import { listDealsForOrganization } from "@/lib/data/deals";

export default async function OrganizationPage({
  params,
}: PageProps<"/contacts/organizations/[id]">) {
  const { id } = await params;
  // One round trip for the record and everything hanging off it — see the
  // person page for why the related blocks are not deferred.
  const [org, people, impact, deals, activities] = await Promise.all([
    getOrganization(id),
    listPersonsForOrganization(id),
    getOrganizationDeleteImpact(id),
    listDealsForOrganization(id),
    listActivitiesForOrganization(id),
  ]);

  if (!org.ok) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState message={org.error} />
      </div>
    );
  }
  if (!org.data) notFound();

  return (
    <FlipScene>
    <div className="mx-auto max-w-3xl">
      <BackLink href="/contacts/organizations" label="Organizations" />

      {/* Staggered arrival — heading, then details, then people. The delays
          are small on purpose: enough to read as a sequence, not enough to
          make anyone wait for the page. See `.enter` in globals.css. */}
      <div className="enter mt-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          {org.data.name}
        </h1>
        <Link
          href={`/contacts/organizations/${id}/edit`}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-medium text-brand-600 transition hover:bg-brand-100"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Edit
        </Link>
      </div>

      <div className="mt-8 space-y-6">
        <RecordCard index={0}>
          <dl>
            <Field label="Industry">{org.data.industry ?? <Missing />}</Field>
            <Field label="Address">{org.data.address ?? <Missing />}</Field>
            <Field label="Website">
              {org.data.website ? (
                <a
                  href={`https://${org.data.website.replace(/^https?:\/\//, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  {org.data.website}
                </a>
              ) : (
                <Missing />
              )}
            </Field>
            <Field label="Owner">{org.data.ownerName ?? <Missing />}</Field>
          </dl>
        </RecordCard>

        <RelatedPeople people={people} index={1} addHref={`/contacts/people/new?org=${id}`} />

        <RelatedDeals deals={deals} index={2} addHref={`/deals/new?org=${id}`} />

        <RelatedActivity activities={activities} index={3} addHref={`/activities/new?org=${id}`} />

        {/* Destructive, so it sits at the bottom, after everything the
            record is — not next to Edit, where a mis-click lands on it. */}
        <div
          className="enter flex justify-end"
          style={{ "--enter-delay": "450ms" } as React.CSSProperties}
        >
          <DeleteRecordButton
            kind="organization"
            id={id}
            name={org.data.name}
            impact={impact}
          />
        </div>
      </div>
    </div>
  </FlipScene>
  );
}
