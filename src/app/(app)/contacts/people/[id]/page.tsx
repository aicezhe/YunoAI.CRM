import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { DeleteRecordButton } from "@/components/contacts/delete-record-button";
import { RelatedActivity, RelatedDeals } from "@/components/contacts/related";
import { BackLink, Field, Missing, RecordCard, RecordLink } from "@/components/ui/record";
import { FlipScene } from "@/components/ui/flip-scene";
import { ErrorState } from "@/components/ui/states";
import { listActivitiesForPerson } from "@/lib/data/activities";
import { getPerson, getPersonDeleteImpact } from "@/lib/data/contacts";
import { listDealsForPerson } from "@/lib/data/deals";

export default async function PersonPage({ params }: PageProps<"/contacts/people/[id]">) {
  const { id } = await params;
  // One round trip for the whole page. The related blocks are part of the
  // record here, not a lazy extra: a contact with no deals and no history is
  // a different thing from one with five of each, and the page should not
  // reveal which it is a beat after it opens.
  const [{ ok, data: person, error }, impact, deals, activities] = await Promise.all([
    getPerson(id),
    getPersonDeleteImpact(id),
    listDealsForPerson(id),
    listActivitiesForPerson(id),
  ]);

  if (!ok) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState message={error} />
      </div>
    );
  }
  if (!person) notFound();


  return (
    <FlipScene>
    <div className="mx-auto max-w-3xl">
      <BackLink href="/contacts/people" label="People" />

      <div className="enter mt-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          {person.name}
        </h1>
        <Link
          href={`/contacts/people/${id}/edit`}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-medium text-brand-600 transition hover:bg-brand-100"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Edit
        </Link>
      </div>

      <div className="mt-8 space-y-6">
        <RecordCard index={0}>
          <dl>
            <Field label="Organization">
              {person.organizationId ? (
                <RecordLink href={`/contacts/organizations/${person.organizationId}`}>
                  {person.organizationName}
                </RecordLink>
              ) : (
                <Missing />
              )}
            </Field>
            <Field label="Email">
              {person.email ? (
                <a href={`mailto:${person.email}`} className="text-brand-600 hover:underline">
                  {person.email}
                </a>
              ) : (
                <Missing />
              )}
            </Field>
            <Field label="Phone">
              {person.phone ? (
                <a href={`tel:${person.phone}`} className="text-brand-600 hover:underline">
                  {person.phone}
                </a>
              ) : (
                <Missing />
              )}
            </Field>
            <Field label="Owner">{person.ownerName ?? <Missing />}</Field>
          </dl>
        </RecordCard>

        {/* The counterparty is prefilled both ways: a deal started from a
            contact is a deal with that contact, and with their company if
            they have one — retyping either would be asking for what the page
            already knows. */}
        <RelatedDeals
          deals={deals}
          index={1}
          addHref={`/deals/new?person=${id}${
            person.organizationId ? `&org=${person.organizationId}` : ""
          }`}
        />

        <RelatedActivity activities={activities} index={2} addHref={`/activities/new?person=${id}`} />

        {/* Destructive, so it sits below the record rather than beside
            Edit — see the organization page. Now that the deals are listed
            above it, "is on 1 deal and can't be deleted" names something the
            reader can actually go and look at. */}
        <div
          className="enter flex justify-end"
          style={{ "--enter-delay": "360ms" } as React.CSSProperties}
        >
          <DeleteRecordButton kind="person" id={id} name={person.name} impact={impact} />
        </div>
      </div>
    </div>
  </FlipScene>
  );
}
