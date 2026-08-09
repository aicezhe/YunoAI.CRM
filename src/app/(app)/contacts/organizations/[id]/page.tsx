import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink, Field, Missing, RecordCard } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import {
  getOrganization,
  listPersonsForOrganization,
} from "@/lib/data/contacts";

export default async function OrganizationPage({
  params,
}: PageProps<"/contacts/organizations/[id]">) {
  const { id } = await params;
  const [org, people] = await Promise.all([
    getOrganization(id),
    listPersonsForOrganization(id),
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
    <div className="mx-auto max-w-3xl">
      <BackLink href="/contacts/organizations" label="Organizations" />

      {/* Staggered arrival — heading, then details, then people. The delays
          are small on purpose: enough to read as a sequence, not enough to
          make anyone wait for the page. See `.enter` in globals.css. */}
      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        {org.data.name}
      </h1>

      <div className="mt-8 space-y-5">
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

        <RecordCard title="People" index={1}>
          {!people.ok ? (
            <p className="py-4 text-sm text-gray-500">{people.error}</p>
          ) : people.data.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">No contacts at this organization yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-brand-200/40">
              {people.data.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <Link
                    href={`/contacts/people/${p.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-brand-600"
                  >
                    {p.name}
                  </Link>
                  <span className="text-sm text-gray-500">{p.email ?? p.phone ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
        </RecordCard>
      </div>
    </div>
  );
}
