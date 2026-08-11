import { RecordSkeleton } from "@/components/ui/record-skeleton";

/** Four cards: the fields, then People, Deals and Activity. */
export default function OrganizationLoading() {
  return <RecordSkeleton cards={4} rows={4} />;
}
