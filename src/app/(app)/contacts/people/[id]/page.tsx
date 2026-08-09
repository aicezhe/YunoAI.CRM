import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink, Field, Missing, RecordCard } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { getPerson } from "@/lib/data/contacts";

export default async function PersonPage({ params }: PageProps<"/contacts/people/[id]">) {
  const { id } = await params;
  const { ok, data: person, error } = await getPerson(id);

  if (!ok) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState message={error} />
      </div>
    );
  }
  if (!person) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/contacts/people" label="People" />

      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        {person.name}
      </h1>

      <div className="mt-8">
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
      </div>
    </div>
  );
}
