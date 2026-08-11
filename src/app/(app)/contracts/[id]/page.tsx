import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink, Field, Missing, RecordCard } from "@/components/ui/record";
import { FlipScene } from "@/components/ui/flip-scene";
import { ErrorState } from "@/components/ui/states";
import { getContract } from "@/lib/data/contracts";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Contract · YunoCRM" };

/**
 * One contract's own page.
 *
 * Exists because the contract rows on a deal's record have to lead
 * somewhere, and leading back to the deal they are already on would be a
 * loop. It is a small record — the terms are the point — but it is a record,
 * which is the argument for contracts being their own table in the first
 * place.
 */
export default async function ContractPage({ params }: PageProps<"/contracts/[id]">) {
  const { id } = await params;
  const contract = await getContract(id);

  if (!contract.ok) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <ErrorState message={contract.error} />
      </main>
    );
  }
  if (!contract.data) notFound();

  const c = contract.data;

  return (
    <FlipScene>
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <BackLink href="/contracts" label="Contracts" />

        <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          {c.dealTitle ?? "Contract"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">Signed {formatDate(c.signedDate)}.</p>

        <div className="mt-8">
          <RecordCard index={0}>
            <dl>
              <Field label="Deal">
                {c.dealId ? (
                  <Link href={`/deals/${c.dealId}`} className="text-brand-600 hover:underline">
                    {c.dealTitle}
                  </Link>
                ) : (
                  <Missing />
                )}
              </Field>
              <Field label="Signed">{formatDate(c.signedDate)}</Field>
              <Field label="Value">{c.value === null ? <Missing /> : formatMoney(c.value)}</Field>
              <Field label="Notes">{c.notes ?? <Missing />}</Field>
            </dl>
          </RecordCard>
        </div>
      </main>
    </FlipScene>
  );
}
