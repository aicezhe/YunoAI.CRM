import { notFound } from "next/navigation";
import { OrganizationForm } from "@/components/contacts/organization-form";
import { BackLink, CARD_STAGGER_MS } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { requireUser } from "@/lib/auth/current-user";
import { getOrganization } from "@/lib/data/contacts";
import { listUsers } from "@/lib/data/users";

export const metadata = { title: "Edit organization · YunoCRM" };

export default async function EditOrganizationPage({
  params,
}: PageProps<"/contacts/organizations/[id]/edit">) {
  const { id } = await params;
  const [user, organization, users] = await Promise.all([
    requireUser(),
    getOrganization(id),
    listUsers(),
  ]);

  if (!organization.ok) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
        <ErrorState message={organization.error} />
      </main>
    );
  }
  if (!organization.data) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href={`/contacts/organizations/${id}`} label={organization.data.name} />

      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        Edit organization
      </h1>

      <div
        className="enter mt-8"
        style={{ "--enter-delay": `${CARD_STAGGER_MS}ms` } as React.CSSProperties}
      >
        {!users.ok ? (
          <ErrorState message={users.error} />
        ) : (
          <OrganizationForm
            organization={organization.data}
            users={users.data}
            currentUserId={user.id}
          />
        )}
      </div>
    </main>
  );
}
