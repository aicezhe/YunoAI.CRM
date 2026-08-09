import { BackLink, CARD_STAGGER_MS } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { requireUser } from "@/lib/auth/current-user";
import { listOrganizations } from "@/lib/data/contacts";
import { listUsers } from "@/lib/data/users";
import { PersonForm } from "./person-form";

export const metadata = { title: "Add contact · YunoCRM" };

export default async function NewPersonPage() {
  const [user, organizations, users] = await Promise.all([
    requireUser(),
    listOrganizations(),
    listUsers(),
  ]);

  const failed = !organizations.ok ? organizations.error : !users.ok ? users.error : null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href="/contacts/people" label="People" />

      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        Add contact
      </h1>
      <p className="mt-2 text-sm text-gray-500">A person you talk to.</p>

      <div
        className="enter mt-8"
        style={{ "--enter-delay": `${CARD_STAGGER_MS}ms` } as React.CSSProperties}
      >
        {failed ? (
          <ErrorState message={failed} />
        ) : (
          <PersonForm
            organizations={organizations.ok ? organizations.data : []}
            users={users.ok ? users.data : []}
            currentUserId={user.id}
          />
        )}
      </div>
    </main>
  );
}
