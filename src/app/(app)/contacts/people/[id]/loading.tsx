import { RecordSkeleton } from "@/components/ui/record-skeleton";

/** Three cards: the fields, then Deals, then Activity — the shape the page
 *  actually lands in, so nothing jumps when the data arrives. */
export default function PersonLoading() {
  return <RecordSkeleton cards={3} rows={4} />;
}
