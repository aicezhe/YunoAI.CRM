import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { AddButton } from "@/components/ui/add-button";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared shell for both contact lists.
 *
 * The header and tabs live here rather than in each page so switching tabs
 * swaps only the table — the title, the counts and the action button do not
 * re-render or flicker, and a slow list shows its own skeleton underneath a
 * header that is already there.
 */
async function getCounts(): Promise<{ people: number; organizations: number }> {
  const supabase = await createClient();

  // head: true asks for the count only, with no rows in the response body.
  const [people, organizations] = await Promise.all([
    supabase.from("persons").select("id", { count: "exact", head: true }),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
  ]);

  // A failed count degrades to a hidden badge rather than taking the section
  // down — the lists below report their own failures.
  return { people: people.count ?? 0, organizations: organizations.count ?? 0 };
}

export default async function ContactsLayout({ children }: { children: React.ReactNode }) {
  const counts = await getCounts();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Contacts"
        description="The people and companies you sell to."
        action={<AddButton label="Add contact" />}
      />

      <div className="mt-6">
        <Tabs
          tabs={[
            { href: "/contacts/people", label: "People", count: counts.people },
            { href: "/contacts/organizations", label: "Organizations", count: counts.organizations },
          ]}
        />
      </div>

      <div className="mt-5">{children}</div>
    </main>
  );
}
