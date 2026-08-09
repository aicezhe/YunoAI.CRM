import { Handshake } from "lucide-react";
import { SectionPage } from "@/components/ui/section-page";

export const metadata = { title: "Deals · YunoCRM" };

export default function DealsPage() {
  return (
    <SectionPage
      icon={Handshake}
      title="Deals"
      description="Opportunities and the stage each one is in."
      emptyDescription="Creating and moving deals by hand is the next step — the tables are already in place."
    />
  );
}
