import { Settings as SettingsIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";

export const metadata = { title: "Settings · YunoCRM" };

/**
 * Placeholder like the rest, with one exception: it shows the resolved
 * account. That makes the role helper observable — change `app_metadata.role`
 * to "admin" in the Supabase Dashboard and the value here changes with it,
 * which is the only way to exercise admin/member before the `users` table
 * exists.
 */
export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader title="Settings" description="Your account and workspace preferences." />

      <section className="mt-8 rounded-3xl border border-brand-200/70 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium text-gray-900">{user.name}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{user.email}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-gray-500">Role</dt>
            <dd>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-500 uppercase">
                {user.role}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-6">
        <EmptyState
          icon={SettingsIcon}
          title="Coming soon"
          description="Editing your profile and managing teammates are the next step. Roles are already enforced by the database."
        />
      </div>
    </main>
  );
}
