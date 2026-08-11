import { Suspense } from "react";
import OrganizationPage from "@/app/(app)/contacts/organizations/[id]/page";
import { FlipPanel } from "@/components/flip-panel";
import { RecordSkeleton } from "@/components/ui/record-skeleton";

/** Gutters here for the same reason as the person modal. */
export default function OrganizationModal(props: PageProps<"/contacts/organizations/[id]">) {
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
