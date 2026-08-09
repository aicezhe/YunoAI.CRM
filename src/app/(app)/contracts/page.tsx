import { FileText } from "lucide-react";
import { AddButton } from "@/components/ui/add-button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Blank, Cell, Row, RowLink, Table } from "@/components/ui/table";
import { listContracts } from "@/lib/data/activities";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Contracts · YunoCRM" };

export default async function ContractsPage() {
  const { ok, data: contracts, error } = await listContracts();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Contracts"
        description="Signed agreements, newest first."
        action={<AddButton label="Add contract" />}
      />

      <div className="mt-8">
        {!ok ? (
          <ErrorState message={error} />
        ) : contracts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No contracts yet"
            description="A contract records what was actually signed against a deal — the date, the amount and the terms worth remembering."
            action={<AddButton label="Add your first contract" size="large" />}
          />
        ) : (
          <Table columns={["Deal", "Signed", "Value", "Notes"]}>
            {contracts.map((contract) => (
              <Row key={contract.id}>
                <RowLink href={`/deals/${contract.dealId}`}>
                  {contract.dealTitle ?? "Deal"}
                </RowLink>
                <Cell muted className="tabular-nums whitespace-nowrap">
                  {formatDate(contract.signedDate)}
                </Cell>
                <Cell className="font-medium tabular-nums">{formatMoney(contract.value)}</Cell>
                <Cell muted className="max-w-xs truncate">
                  {contract.notes ?? <Blank />}
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </div>
    </main>
  );
}
