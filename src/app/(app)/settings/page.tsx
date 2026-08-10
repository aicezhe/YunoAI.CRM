import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/states";
import { RecordCard } from "@/components/ui/record";
import { isAdmin, requireUser } from "@/lib/auth/current-user";
import { listTeam } from "@/lib/data/users";
import { ProfileNameForm } from "./profile-name-form";
import { PasswordForm } from "./password-form";
import { TeamRoster } from "./team-roster";

export const metadata = { title: "Settings · YunoCRM" };

export default async function SettingsPage() {
  const [user, admin, team] = await Promise.all([requireUser(), isAdmin(), listTeam()]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader title="Settings" description="Your account and workspace preferences." />

      <div className="mt-8 space-y-6">
        <RecordCard title="Account" index={0}>
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Name</p>
              <ProfileNameForm name={user.name} />
            </div>

            {/* Email and role are shown, never edited, here: email belongs to
                Supabase Auth and changing it needs its own re-confirmation
                flow this app doesn't have, and role is admin-only — see the
                Team card below, where an admin can change anyone's but their
                own. */}
            <dl className="space-y-3 border-t border-brand-200/40 pt-4 text-sm">
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
          </div>
        </RecordCard>

        <RecordCard title="Password" index={1}>
          <p className="-mt-1 mb-4 text-sm text-gray-500">Update the password you sign in with.</p>
          <PasswordForm />
        </RecordCard>

        <RecordCard title="Team" index={2}>
          <p className="-mt-1 mb-4 text-sm text-gray-500">
            {admin ? "Everyone with access, and their role." : "Everyone with access."}
          </p>
          {!team.ok ? (
            <ErrorState message={team.error} />
          ) : (
            <TeamRoster members={team.data} currentUserId={user.id} canManage={admin} />
          )}
        </RecordCard>
      </div>
    </main>
  );
}
