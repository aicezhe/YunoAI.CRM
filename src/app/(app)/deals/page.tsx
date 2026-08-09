import { Handshake } from "lucide-react";
import { AddButton } from "@/components/ui/add-button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Blank, Cell, Row, RowLink, Table } from "@/components/ui/table";
import { StageBadge, StatusBadge } from "@/components/ui/badges";
import { listDeals } from "@/lib/data/deals";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Deals · YunoCRM" };

export default async function DealsPage() {
  const { ok, data: deals, error } = await listDeals();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Deals"
        description="Every opportunity and the stage it is in."
        action={<AddButton label="Add deal" />}
      />

      <div className="mt-8">
        {!ok ? (
          <ErrorState message={error} />
        ) : deals.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No deals yet"
            description="A deal is one opportunity with one customer. Add the first and it starts moving through the pipeline."
            action={<AddButton label="Add your first deal" size="large" />}
          />
        ) : (
          <Table
            columns={["Title", "With", "Stage", "Value", "Owner", "Expected close"]}
          >
            {deals.map((deal, i) => (
              <Row key={deal.id} index={i} count={deals.length}>
                <RowLink href={`/deals/${deal.id}`}>{deal.title}</RowLink>

                {/* One column for both counterparties: the schema allows
                    either, and two half-empty columns would read worse than
                    one that always has something in it. */}
                <Cell muted>
                  {deal.organizationName ?? deal.personName ?? <Blank />}
                  {deal.organizationName && deal.personName && (
                    <span className="block text-xs text-gray-400">{deal.personName}</span>
                  )}
                </Cell>

                <Cell>
                  {deal.status === "open" ? (
                    <StageBadge name={deal.stageName} />
                  ) : (
                    <StatusBadge status={deal.status} />
                  )}
                </Cell>

                <Cell className="font-medium tabular-nums">
                  {formatMoney(deal.value, deal.currency)}
                </Cell>

                <Cell muted>{deal.ownerName ?? <Blank />}</Cell>
                <Cell muted className="tabular-nums">
                  {formatDate(deal.expectedCloseDate)}
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </div>
    </main>
  );
}
