import { BackLink, CARD_STAGGER_MS } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { listOrganizations, listPersons } from "@/lib/data/contacts";
import { listDeals } from "@/lib/data/deals";
import { ActivityForm } from "./activity-form";

export const metadata = { title: "Add activity · YunoCRM" };

export default async function NewActivityPage() {
  const [deals, persons, organizations] = await Promise.all([
    listDeals(),
    listPersons(),
    listOrganizations(),
  ]);

  const failed =
    (!deals.ok && deals.error) ||
    (!persons.ok && persons.error) ||
    (!organizations.ok && organizations.error) ||
    null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href="/activities/open" label="Activities" />

      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        Add activity
      </h1>
      <p className="mt-2 text-sm text-gray-500">A call, meeting, task or note.</p>

      <div
        className="enter mt-8"
        style={{ "--enter-delay": `${CARD_STAGGER_MS}ms` } as React.CSSProperties}
      >
        {failed ? (
          <ErrorState message={failed} />
        ) : (
          <ActivityForm
            deals={deals.ok ? deals.data : []}
            persons={persons.ok ? persons.data : []}
            organizations={organizations.ok ? organizations.data : []}
          />
        )}
      </div>
    </main>
  );
}
