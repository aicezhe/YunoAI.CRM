import { notFound } from "next/navigation";
import { PersonForm } from "@/components/contacts/person-form";
import { BackLink, CARD_STAGGER_MS } from "@/components/ui/record";
import { ErrorState } from "@/components/ui/states";
import { requireUser } from "@/lib/auth/current-user";
import { getPerson, listOrganizations } from "@/lib/data/contacts";
import { listUsers } from "@/lib/data/users";

export const metadata = { title: "Edit contact · YunoCRM" };

export default async function EditPersonPage({ params }: PageProps<"/contacts/people/[id]/edit">) {
  const { id } = await params;
  const [user, person, organizations, users] = await Promise.all([
    requireUser(),
    getPerson(id),
    listOrganizations(),
    listUsers(),
  ]);

  if (!person.ok) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
        <ErrorState message={person.error} />
      </main>
    );
  }
  if (!person.data) notFound();

  const failed = !organizations.ok ? organizations.error : !users.ok ? users.error : null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <BackLink href={`/contacts/people/${id}`} label={person.data.name} />

      <h1 className="enter mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        Edit contact
      </h1>

      <div
        className="enter mt-8"
        style={{ "--enter-delay": `${CARD_STAGGER_MS}ms` } as React.CSSProperties}
      >
        {failed ? (
          <ErrorState message={failed} />
        ) : (
          <PersonForm
            person={person.data}
            organizations={organizations.ok ? organizations.data : []}
            users={users.ok ? users.data : []}
            currentUserId={user.id}
          />
        )}
      </div>
    </main>
  );
}
