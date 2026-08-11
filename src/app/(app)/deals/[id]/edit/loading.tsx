import { RecordSkeleton } from "@/components/ui/record-skeleton";

/** One card, shaped like the form it stands in for. */
export default function EditDealLoading() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <RecordSkeleton cards={1} rows={8} />
    </main>
  );
}
