import { FileText } from "lucide-react";
import { SectionPage } from "@/components/ui/section-page";

export const metadata = { title: "Contracts · YunoCRM" };

export default function ContractsPage() {
  return (
    <SectionPage
      icon={FileText}
      title="Contracts"
      description="Signed agreements and their terms."
      emptyDescription="Recording contracts by hand is the next step — the tables are already in place."
    />
  );
}
