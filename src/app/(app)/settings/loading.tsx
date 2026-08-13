import { HeaderSkeleton } from "@/components/ui/states";
import { RecordSkeleton } from "@/components/ui/record-skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <HeaderSkeleton />
      <div className="mt-8">
        <RecordSkeleton cards={4} rows={3} />
      </div>
    </div>
  );
}
