import Link from "next/link";
import { Users } from "lucide-react";
import { AddButton } from "@/components/ui/add-button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Blank, Card, Cell, EmailChip, PhoneLink, Row, RowLink, Table } from "@/components/ui/table";
import { listPersons } from "@/lib/data/contacts";

export const metadata = { title: "People · YunoCRM" };

export default async function PeoplePage() {
  const { ok, data: people, error } = await listPersons();

  if (!ok) return <ErrorState message={error} />;

  if (people.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No people yet"
        description="Contacts are the individuals you talk to. Add the first one and their deals and activities hang off it."
        action={<AddButton label="Add your first contact" size="large" href="/contacts/people/new" />}
      />
    );
  }

  return (
    <>
      <Table columns={["Name", "Organization", "Email", "Phone", "Owner"]}>
        {people.map((person, i) => (
          <Row key={person.id} index={i} count={people.length}>
            <RowLink href={`/contacts/people/${person.id}`}>{person.name}</RowLink>

            <Cell muted>
              {person.organizationId ? (
                // Sits above the row's stretched link so it can be followed on
                // its own — the org is a destination, not just a label.
                <Link
                  href={`/contacts/organizations/${person.organizationId}`}
                  className="relative z-10 hover:text-brand-600 hover:underline"
                >
                  {person.organizationName}
                </Link>
              ) : (
                <Blank />
              )}
            </Cell>

            <Cell muted>{person.email ? <EmailChip email={person.email} /> : <Blank />}</Cell>
            <Cell muted>{person.phone ? <PhoneLink phone={person.phone} /> : <Blank />}</Cell>
            <Cell muted>{person.ownerName ?? <Blank />}</Cell>
          </Row>
        ))}
      </Table>

      <div className="space-y-3 md:hidden">
        {people.map((person, i) => (
          <Card key={person.id} index={i} count={people.length}>
            <Link
              href={`/contacts/people/${person.id}`}
              className="font-semibold text-gray-900 after:absolute after:inset-0 after:content-['']"
            >
              {person.name}
            </Link>

            <p className="mt-1 truncate text-sm text-gray-500">
              {person.organizationId ? (
                <Link
                  href={`/contacts/organizations/${person.organizationId}`}
                  className="relative z-10 hover:text-brand-600 hover:underline"
                >
                  {person.organizationName}
                </Link>
              ) : (
                <Blank />
              )}
            </p>

            {(person.email || person.phone) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {person.email && <EmailChip email={person.email} />}
                {person.phone && <PhoneLink phone={person.phone} />}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
