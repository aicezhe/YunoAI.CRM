import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { DeleteRecordButton } from "@/components/contacts/delete-record-button";
import { BackLink, Field, Missing, RecordCard } from "@/components/ui/record";
import { FlipScene } from "@/components/ui/flip-scene";
import { ErrorState } from "@/components/ui/states";
import { getPerson, getPersonDeleteImpact } from "@/lib/data/contacts";

export default async function PersonPage({ params }: PageProps<"/contacts/people/[id]">) {
  const { id } = await params;
  const [{ ok, data: person, error }, impact] = await Promise.all([
    getPerson(id),
    getPersonDeleteImpact(id),
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
                <Link
                  href={`/contacts/organizations/${person.organizationId}`}
                  className="text-brand-600 hover:underline"
                >
                  {person.organizationName}
                </Link>
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

        {/* Destructive, so it sits below the record rather than beside
            Edit — see the organization page. */}
        <div
          className="enter flex justify-end"
          style={{ "--enter-delay": "180ms" } as React.CSSProperties}
        >
          <DeleteRecordButton kind="person" id={id} name={person.name} impact={impact} />
        </div>
      </div>
    </div>
  </FlipScene>
  );
}
