import { HeaderSkeleton, TableSkeleton } from "@/components/ui/states";

export default function ActivitiesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <HeaderSkeleton />
      <div className="mt-8">
        <TableSkeleton rows={8} columns={5} />
      </div>
    </div>
  );
}
