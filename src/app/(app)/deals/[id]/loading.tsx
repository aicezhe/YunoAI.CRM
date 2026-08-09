import { RecordSkeleton } from "@/components/ui/record-skeleton";

/** Wrapped in the page's own gutters — unlike the contacts record pages,
 *  which get theirs from the Contacts layout. */
export default function DealLoading() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <RecordSkeleton cards={2} rows={5} />
    </main>
  );
}
