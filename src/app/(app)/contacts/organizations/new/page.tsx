import { BackLink, CARD_STAGGER_MS } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { requireUser } from "@/lib/auth/current-user";
import { listUsers } from "@/lib/data/users";
import { OrganizationForm } from "@/components/contacts/organization-form";

export const metadata = { title: "Add organization · YunoCRM" };

export default async function NewOrganizationPage() {
  const [user, users] = await Promise.all([requireUser(), listUsers()]);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href="/contacts/organizations" label="Organizations" />

      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        Add organization
      </h1>
      <p className="mt-2 text-sm text-gray-500">A company you sell to.</p>

      <div
        className="enter mt-8"
        style={{ "--enter-delay": `${CARD_STAGGER_MS}ms` } as React.CSSProperties}
      >
        {!users.ok ? (
          <ErrorState message={users.error} />
        ) : (
          <OrganizationForm users={users.data} currentUserId={user.id} />
        )}
      </div>
    </main>
  );
}
