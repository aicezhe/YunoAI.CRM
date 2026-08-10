import { Building2 } from "lucide-react";
import { AddButton } from "@/components/ui/add-button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Blank, CardLink, Cell, Row, RowLink, Table } from "@/components/ui/table";
import { listOrganizations } from "@/lib/data/contacts";

export const metadata = { title: "Organizations · YunoCRM" };

export default async function OrganizationsPage() {
  const { ok, data: organizations, error } = await listOrganizations();

  if (!ok) return <ErrorState message={error} />;

  if (organizations.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No organizations yet"
        description="Organizations are the companies you sell to. Add one and you can attach its people, deals and contracts."
        action={
          <AddButton label="Add your first organization" size="large" href="/contacts/organizations/new" />
        }
      />
    );
  }

  return (
    <>
      <Table columns={["Name", "Industry", "Address", "People", "Owner"]}>
        {organizations.map((org, i) => (
          <Row key={org.id} index={i} count={organizations.length}>
            <RowLink href={`/contacts/organizations/${org.id}`}>{org.name}</RowLink>
            <Cell muted>{org.industry ?? <Blank />}</Cell>
            <Cell muted>{org.address ?? <Blank />}</Cell>
            <Cell muted>
              {/* A count of zero is worth showing plainly — it is the signal
                  that a company has no one to call yet. */}
              <span className="inline-flex min-w-6 justify-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-500">
                {org.peopleCount}
              </span>
            </Cell>
            <Cell muted>{org.ownerName ?? <Blank />}</Cell>
          </Row>
        ))}
      </Table>

      <div className="space-y-3 md:hidden">
        {organizations.map((org, i) => (
          <CardLink
            key={org.id}
            href={`/contacts/organizations/${org.id}`}
            index={i}
            count={organizations.length}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{org.name}</p>
                <p className="mt-0.5 truncate text-sm text-gray-500">{org.industry ?? <Blank />}</p>
              </div>
              <span className="inline-flex min-w-6 shrink-0 justify-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-500">
                {org.peopleCount}
              </span>
            </div>
          </CardLink>
        ))}
      </div>
    </>
  );
}
