import { Users } from "lucide-react";
import { SectionPage } from "@/components/ui/section-page";

export const metadata = { title: "People · YunoCRM" };

export default function PeoplePage() {
  return (
    <SectionPage
      icon={Users}
      title="People"
      description="Contacts, and the organizations they belong to."
      emptyDescription="Adding contacts by hand arrives with the next step, together with the database migrations."
    />
  );
}
