import { Suspense } from "react";
import ActivityPage from "@/app/(app)/activities/[id]/page";
import { FlipPanel } from "@/components/flip-panel";
import { RecordSkeleton } from "@/components/ui/record-skeleton";

/** See the deals modal for why this is sync with a Suspense inside. */
export default function ActivityModal(props: PageProps<"/activities/[id]">) {
  return (
    <FlipPanel>
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
            <RecordSkeleton cards={1} rows={6} />
          </div>
        }
      >
        <ActivityPage {...props} />
      </Suspense>
    </FlipPanel>
  );
}
