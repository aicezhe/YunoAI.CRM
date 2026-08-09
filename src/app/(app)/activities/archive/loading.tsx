import { TableSkeleton } from "@/components/ui/states";

/** Only the table is replaced — the Activities header and tabs come from the
 *  layout above and stay put while this loads. */
export default function ArchiveLoading() {
  return <TableSkeleton rows={7} columns={5} />;
}
