import { Suspense } from "react";
import ActivityPage from "@/app/(app)/activities/[id]/page";
import { FlipPanel } from "@/components/flip-panel";
import { RecordSkeleton } from "@/components/ui/record-skeleton";
import { isRecordId } from "@/lib/record-id";

/** See the deals modal for why the record streams into a Suspense boundary. */
export default async function ActivityModal(props: PageProps<"/activities/[id]">) {
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
            <RecordSkeleton cards={1} rows={6} />
          </div>
        }
      >
        <ActivityPage {...props} />
      </Suspense>
    </FlipPanel>
  );
}
