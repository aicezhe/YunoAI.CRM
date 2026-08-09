import { redirect } from "next/navigation";

/** /activities has no list of its own — the open work is the default tab. */
export default function ActivitiesIndex() {
  redirect("/activities/open");
}
