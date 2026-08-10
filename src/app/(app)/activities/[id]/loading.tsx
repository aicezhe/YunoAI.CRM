import { RecordSkeleton } from "@/components/ui/record-skeleton";

export default function ActivityLoading() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <RecordSkeleton cards={1} rows={5} />
    </main>
  );
}
