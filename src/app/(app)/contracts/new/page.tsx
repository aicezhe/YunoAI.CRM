import Link from "next/link";
import { Handshake } from "lucide-react";
import { BackLink, CARD_STAGGER_MS } from "@/components/ui/record";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { getDeal, listDeals } from "@/lib/data/deals";
import { ContractForm } from "./contract-form";

export const metadata = { title: "Add contract · YunoCRM" };

/** See the deal form's copy of this — a repeated query parameter arrives as
 *  an array, and one id is all this can use. */
function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewContractPage({ searchParams }: PageProps<"/contracts/new">) {
  const { deal: dealParam } = await searchParams;
  const dealId = single(dealParam);

  const [{ ok, data: deals, error }, fixedDeal] = await Promise.all([
    listDeals(),
    dealId ? getDeal(dealId) : Promise.resolve(null),
  ]);

  // A deal id that names nothing falls back to the ordinary picker rather
  // than failing — the form still works, it just asks one more question.
  const deal = fixedDeal?.ok ? (fixedDeal.data ?? undefined) : undefined;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink
        href={deal ? `/deals/${deal.id}` : "/contracts"}
        label={deal ? deal.title : "Contracts"}
      />

      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        Add contract
      </h1>
      <p className="mt-2 text-sm text-gray-500">Record what was actually signed against a deal.</p>

      <div
        className="enter mt-8"
        style={{ "--enter-delay": `${CARD_STAGGER_MS}ms` } as React.CSSProperties}
      >
        {!ok ? (
          <ErrorState message={error} />
        ) : deals.length === 0 ? (
          // A contract can't exist without something it was signed for, and
          // deals have no create form yet either — so the honest next step
          // is pointing back at the section that does, not a dead end.
          <EmptyState
            icon={Handshake}
            title="No deals yet"
            description="A contract belongs to a deal. Once there's a deal to attach it to, come back here to record what was signed."
            action={
              <Link
                href="/deals"
                className="inline-flex min-h-11 items-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600"
              >
                Go to Deals
              </Link>
            }
          />
        ) : (
          <ContractForm deal={deal} deals={deals} today={new Date().toISOString().slice(0, 10)} />
        )}
      </div>
    </main>
  );
}
