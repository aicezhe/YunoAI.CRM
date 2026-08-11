import { Suspense } from "react";
import DealPage from "@/app/(app)/deals/[id]/page";
import { FlipPanel } from "@/components/flip-panel";
import { RecordSkeleton } from "@/components/ui/record-skeleton";
import { isRecordId } from "@/lib/record-id";

/**
 * The record itself streams into a Suspense boundary rather than being
 * awaited here. The panel has to be on screen and flipping while the queries
 * are still running — awaited, the flip would only start once the data
 * landed, and the click would feel dead for as long as that took. The
 * skeleton the full page uses fills the gap, so the panel flips open already
 * shaped like the record it is about to hold.
 *
 * `params` is awaited, but that only resolves the URL segment, not a query.
 */
export default async function DealModal(props: PageProps<"/deals/[id]">) {
  // Sibling routes at this depth ("open", "archive", "new") match [id] too —
  // see isRecordId. Nothing in the slot for them; the real page renders as
  // usual underneath.
  const { id } = await props.params;
  if (!isRecordId(id)) return null;

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
