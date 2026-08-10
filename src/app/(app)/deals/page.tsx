import { Handshake } from "lucide-react";
import { AddButton } from "@/components/ui/add-button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DealsTable } from "@/components/deals/deals-table";
import { requireUser } from "@/lib/auth/current-user";
import { listDeals } from "@/lib/data/deals";

export const metadata = { title: "Deals · YunoCRM" };

export default async function DealsPage() {
  const [user, { ok, data: deals, error }] = await Promise.all([requireUser(), listDeals()]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Deals"
        description="Every opportunity and the stage it is in."
        action={<AddButton label="Add deal" href="/deals/new" />}
      />

      <div className="mt-8">
        {!ok ? (
          <ErrorState message={error} />
        ) : deals.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No deals yet"
            description="A deal is one opportunity with one customer. Add the first and it starts moving through the pipeline."
            action={<AddButton label="Add your first deal" size="large" href="/deals/new" />}
          />
        ) : (
          <DealsTable deals={deals} currentUserId={user.id} />
        )}
      </div>
    </main>
  );
}
