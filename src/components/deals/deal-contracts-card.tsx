import Link from "next/link";
import { FileText, Plus, Trophy } from "lucide-react";
import { RecordCard } from "@/components/ui/record";
import { InlineEmpty } from "@/components/ui/states";
import type { ContractRow, DealStatus, Result } from "@/lib/data/types";
import { formatDate, formatMoney } from "@/lib/format";

/**
 * The contracts signed against this deal, and the nudge to record one after
 * a win.
 *
 * Winning is not signing. The contract is deliberately not created when the
 * deal moves to Won: at that moment the signing date and the final amount do
 * not exist yet — they arrive days later, off a document nobody has sent.
 * Creating a row then would mean inventing both, and an invented signing
 * date is worse than a missing contract, because it looks like a fact.
 *
 * So a won deal gets a prompt, not a record. The prompt is loud, because the
 * whole point is that this step is easy to forget once the celebrating is
 * done — and quiet the moment there is a contract, because then it is just a
 * list of what was signed.
 */
export function DealContractsCard({
  dealId,
  status,
  contracts,
  index,
}: {
  dealId: string;
  status: DealStatus;
  contracts: Result<ContractRow[]>;
  index: number;
}) {
  const addHref = `/contracts/new?deal=${dealId}`;
  const has = contracts.ok && contracts.data.length > 0;

  // Nothing to show and nothing to prompt: an open deal with no contract is
  // the ordinary case, not a gap worth a card.
  if (!has && status !== "won" && contracts.ok) return null;

  return (
    <RecordCard
      index={index}
      title="Contracts"
      action={
        has ? (
          <Link
            href={addHref}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 text-xs font-semibold text-white shadow-sm shadow-brand-500/25 transition-colors hover:bg-brand-600"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Add contract
          </Link>
        ) : undefined
      }
    >
      {!contracts.ok ? (
        <p className="py-4 text-sm text-gray-500">{contracts.error}</p>
      ) : has ? (
        <ul className="divide-y divide-brand-200/40">
          {contracts.data.map((contract) => (
            <li
              key={contract.id}
              className="relative flex items-center gap-3 py-3 transition-colors duration-150 ease-out hover:bg-brand-50/60"
            >
              <FileText className="h-4 w-4 shrink-0 text-brand-400" strokeWidth={1.75} aria-hidden />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/contracts/${contract.id}`}
                  className="text-sm font-medium text-gray-900 transition-colors after:absolute after:inset-0 after:content-[''] hover:text-brand-600"
                >
                  Signed {formatDate(contract.signedDate)}
                </Link>
                {contract.notes && (
                  <p className="mt-0.5 truncate text-xs text-gray-400">{contract.notes}</p>
                )}
              </div>
              <span className="shrink-0 text-sm font-medium text-gray-900 tabular-nums">
                {formatMoney(contract.value)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        // Won, and nothing signed recorded yet.
        <InlineEmpty
          icon={Trophy}
          title="Deal won — register the signed contract."
          action={
            <Link
              href={addHref}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-colors hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              Add contract
            </Link>
          }
        />
      )}
    </RecordCard>
  );
}
