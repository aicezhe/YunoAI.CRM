import { Suspense } from "react";
import PersonPage from "@/app/(app)/contacts/people/[id]/page";
import { FlipPanel } from "@/components/flip-panel";
import { RecordSkeleton } from "@/components/ui/record-skeleton";

/**
 * The gutters are added here, unlike the deals and activities modals: the
 * person page has none of its own — on the full page they come from the
 * Contacts layout, which the panel deliberately does not render (its header
 * and tabs belong to the list underneath, not on top of it).
 *
 * See the deals modal for why this is sync with a Suspense inside.
 */
export default function PersonModal(props: PageProps<"/contacts/people/[id]">) {
  return (
    <FlipPanel>
      <div className="px-5 py-8 sm:px-8 sm:py-10">
        <Suspense fallback={<RecordSkeleton cards={1} rows={4} />}>
          <PersonPage {...props} />
        </Suspense>
      </div>
    </FlipPanel>
  );
}
