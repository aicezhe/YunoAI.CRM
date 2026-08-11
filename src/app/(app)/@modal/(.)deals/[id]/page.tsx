import { Suspense } from "react";
import DealPage from "@/app/(app)/deals/[id]/page";
import { FlipPanel } from "@/components/flip-panel";
import { RecordSkeleton } from "@/components/ui/record-skeleton";

/**
 * Deliberately not `async`: the panel has to be on screen and flipping while
 * the record's queries are still running. An async component here would make
 * the whole route wait, and the flip would only start once the data landed —
 * the click would feel dead for as long as the query took.
 *
 * So the page renders instantly, and the record streams into a Suspense
 * boundary inside it. The same skeleton the full page uses fills the gap, so
 * the panel flips open already shaped like the record it is about to hold.
 */
export default function DealModal(props: PageProps<"/deals/[id]">) {
  return (
    <FlipPanel>
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
            <RecordSkeleton cards={2} rows={5} />
          </div>
        }
      >
        <DealPage {...props} />
      </Suspense>
    </FlipPanel>
  );
}
