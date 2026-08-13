import { notFound, redirect } from "next/navigation";
import { ContractForm } from "@/app/(app)/contracts/new/contract-form";
import { BackLink, CARD_STAGGER_MS } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { isAdmin } from "@/lib/auth/current-user";
import { getContract } from "@/lib/data/contracts";

export const metadata = { title: "Edit contract · YunoCRM" };

/**
 * Admin-only, and the page enforces it itself rather than trusting the
 * hidden button: a member who opens the URL by hand is sent back to the
 * contract, not shown a form whose save would fail. The action and the RLS
 * policy behind it check again — see updateContract.
 */
export default async function EditContractPage({ params }: PageProps<"/contracts/[id]/edit">) {
  const { id } = await params;

  if (!(await isAdmin())) redirect(`/contracts/${id}`);

  const contract = await getContract(id);

  if (!contract.ok) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
        <ErrorState message={contract.error} />
      </main>
    );
  }
  if (!contract.data) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href={`/contracts/${id}`} label={contract.data.dealTitle ?? "Contract"} />

      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        Edit contract
      </h1>
      <p className="mt-2 text-sm text-gray-500">Correct what was recorded — the deal itself stays.</p>

      <div
        className="enter mt-8"
        style={{ "--enter-delay": `${CARD_STAGGER_MS}ms` } as React.CSSProperties}
      >
        <ContractForm
          contract={contract.data}
          deals={[]}
          today={new Date().toISOString().slice(0, 10)}
        />
      </div>
    </main>
  );
}
