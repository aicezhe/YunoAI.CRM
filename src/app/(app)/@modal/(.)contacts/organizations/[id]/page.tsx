import { Suspense } from "react";
import OrganizationPage from "@/app/(app)/contacts/organizations/[id]/page";
import { FlipPanel } from "@/components/flip-panel";
import { RecordSkeleton } from "@/components/ui/record-skeleton";
import { isRecordId } from "@/lib/record-id";

/** Gutters here for the same reason as the person modal. */
export default async function OrganizationModal(props: PageProps<"/contacts/organizations/[id]">) {
  // Sibling routes at this depth ("open", "archive", "new") match [id] too —
  // see isRecordId. Nothing in the slot for them; the real page renders as
  // usual underneath.
  const { id } = await props.params;
  if (!isRecordId(id)) return null;

  return (
    <FlipPanel>
      <div className="px-5 py-8 sm:px-8 sm:py-10">
        <Suspense fallback={<RecordSkeleton cards={2} rows={4} />}>
          <OrganizationPage {...props} />
        </Suspense>
      </div>
    </FlipPanel>
  );
}
