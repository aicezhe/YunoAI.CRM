import Link from "next/link";
import { Users } from "lucide-react";
import { AddButton } from "@/components/ui/add-button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Blank, Cell, EmailChip, PhoneLink, Row, RowLink, Table } from "@/components/ui/table";
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
        action={<AddButton label="Add your first contact" size="large" />}
      />
    );
  }

  return (
    <Table columns={["Name", "Organization", "Email", "Phone", "Owner"]}>
      {people.map((person) => (
        <Row key={person.id}>
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
  );
}
