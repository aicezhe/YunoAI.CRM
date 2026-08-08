import type { LucideIcon } from "lucide-react";
import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";

/**
 * A whole section screen: header plus empty state, on the shared page
 * gutters.
 *
 * All seven sections are identical placeholders right now, so they share one
 * component instead of seven near-copies — when a section grows real content
 * it stops using this and composes PageHeader + its own body directly.
 */
export function SectionPage({
  title,
  description,
  icon,
  emptyTitle = "Coming soon",
  emptyDescription,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle?: string;
  emptyDescription: string;
}) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader title={title} description={description} />
      <div className="mt-8">
        <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
      </div>
    </main>
  );
}
