import { BackLink, CARD_STAGGER_MS } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { requireUser } from "@/lib/auth/current-user";
import { listOrganizations, listPersons } from "@/lib/data/contacts";
import { listStages } from "@/lib/data/deals";
import { listUsers } from "@/lib/data/users";
import { DealForm } from "./deal-form";

export const metadata = { title: "Add deal · YunoCRM" };

export default async function NewDealPage() {
  const [user, organizations, persons, stages, users] = await Promise.all([
    requireUser(),
    listOrganizations(),
    listPersons(),
    listStages(),
    listUsers(),
  ]);

  // .find()'s predicate doesn't narrow the union for TypeScript, so this
  // reads the message out directly instead of asserting past `string | null`.
  const failed =
    (!organizations.ok && organizations.error) ||
    (!persons.ok && persons.error) ||
    (!stages.ok && stages.error) ||
    (!users.ok && users.error) ||
    null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href="/deals" label="Deals" />

      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        Add deal
      </h1>
      <p className="mt-2 text-sm text-gray-500">A new opportunity, starting in the pipeline.</p>

      <div
        className="enter mt-8"
        style={{ "--enter-delay": `${CARD_STAGGER_MS}ms` } as React.CSSProperties}
      >
        {failed ? (
          <ErrorState message={failed} />
        ) : (
          <DealForm
            organizations={organizations.ok ? organizations.data : []}
            persons={persons.ok ? persons.data : []}
            stages={stages.ok ? stages.data : []}
            users={users.ok ? users.data : []}
            currentUserId={user.id}
          />
        )}
      </div>
    </main>
  );
}
