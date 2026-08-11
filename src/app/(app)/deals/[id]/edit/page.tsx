import { notFound } from "next/navigation";
import { DealForm } from "@/components/deals/deal-form";
import { BackLink, CARD_STAGGER_MS } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { requireUser } from "@/lib/auth/current-user";
import { listOrganizations, listPersons } from "@/lib/data/contacts";
import { getDeal, listStages } from "@/lib/data/deals";
import { listUsers } from "@/lib/data/users";

export const metadata = { title: "Edit deal · YunoCRM" };

export default async function EditDealPage({ params }: PageProps<"/deals/[id]/edit">) {
  const { id } = await params;
  const [user, deal, organizations, persons, stages, users] = await Promise.all([
    requireUser(),
    getDeal(id),
    listOrganizations(),
    listPersons(),
    listStages(),
    listUsers(),
  ]);

  if (!deal.ok) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
        <ErrorState message={deal.error} />
      </main>
    );
  }
  if (!deal.data) notFound();

  const failed =
    (!organizations.ok && organizations.error) ||
    (!persons.ok && persons.error) ||
    (!stages.ok && stages.error) ||
    (!users.ok && users.error) ||
    null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href={`/deals/${id}`} label={deal.data.title} />

      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        Edit deal
      </h1>

      <div
        className="enter mt-8"
        style={{ "--enter-delay": `${CARD_STAGGER_MS}ms` } as React.CSSProperties}
      >
        {failed ? (
          <ErrorState message={failed} />
        ) : (
          <DealForm
            deal={deal.data}
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
