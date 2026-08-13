import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { BackLink, Field, Missing, RecordCard, RecordLink } from "@/components/ui/record";
import { FlipScene } from "@/components/ui/flip-scene";
import { ErrorState } from "@/components/ui/states";
import { isAdmin } from "@/lib/auth/current-user";
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
  const [contract, admin] = await Promise.all([getContract(id), isAdmin()]);

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

        {/* Edit renders for admins only — correcting a signed record is an
            accountable act, which is what the admin role is. The page and
            action behind the button enforce it again. */}
        <div className="enter mt-4 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {c.dealTitle ?? "Contract"}
          </h1>
          {admin && (
            <Link
              href={`/contracts/${id}/edit`}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-medium text-brand-600 transition hover:bg-brand-100"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Edit
            </Link>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">Signed {formatDate(c.signedDate)}.</p>

        <div className="mt-8">
          <RecordCard index={0}>
            <dl>
              <Field label="Deal">
                {c.dealId ? (
                  <RecordLink href={`/deals/${c.dealId}`}>
                    {c.dealTitle}
                  </RecordLink>
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
