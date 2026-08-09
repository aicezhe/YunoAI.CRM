import { Building2 } from "lucide-react";
import { SectionPage } from "@/components/ui/section-page";

export const metadata = { title: "Organizations · YunoCRM" };

export default function OrganizationsPage() {
  return (
    <SectionPage
      icon={Building2}
      title="Organizations"
      description="The companies you work with."
      emptyDescription="Adding organizations by hand is the next step — the tables are already in place."
    />
  );
}
