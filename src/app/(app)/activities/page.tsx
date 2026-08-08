import { CalendarCheck } from "lucide-react";
import { SectionPage } from "@/components/ui/section-page";

export const metadata = { title: "Activities · YunoCRM" };

export default function ActivitiesPage() {
  return (
    <SectionPage
      icon={CalendarCheck}
      title="Activities"
      description="Calls, meetings and tasks logged against your records."
      emptyDescription="Logging activities by hand arrives with the next step, together with the database migrations."
    />
  );
}
