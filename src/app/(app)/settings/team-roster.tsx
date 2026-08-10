"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "@/lib/data/actions";
import type { TeamMember } from "@/lib/data/users";

export function TeamRoster({
  members,
  currentUserId,
  canManage,
}: {
  members: TeamMember[];
  currentUserId: string;
  /** True only for admins. Members still see the whole roster — the RLS
   *  policy that exposes it has no admin gate — just no control over it. */
  canManage: boolean;
}) {
  return (
    <ul className="divide-y divide-brand-200/40">
      {members.map((member) => (
        <TeamRow
          key={member.id}
          member={member}
          isSelf={member.id === currentUserId}
          canManage={canManage}
        />
      ))}
    </ul>
  );
}

function TeamRow({
  member,
  isSelf,
  canManage,
}: {
  member: TeamMember;
  isSelf: boolean;
  canManage: boolean;
}) {
  // Local, controlled state — not a defaultValue-based select. That is the
  // fix for the bug found on the contract form: an uncontrolled select's
  // value does not survive a re-render the way a plain input's does, and
  // startTransition's pending state is exactly the kind of re-render that
  // would trigger it. Genuinely local state sidesteps the whole issue.
  const [role, setRole] = useState(member.role);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    const previous = role;
    setRole(next);
    setError(null);
    startTransition(async () => {
      try {
        await setUserRole(member.id, next);
      } catch (err) {
        setRole(previous);
        setError(err instanceof Error ? err.message : "Could not change this role.");
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {member.name}
          {isSelf && <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>}
        </p>
        <p className="truncate text-xs text-gray-400">{member.email}</p>
      </div>

      {canManage && !isSelf ? (
        <div className="shrink-0 text-right">
          <select
            value={role}
            disabled={pending}
            onChange={(e) => change(e.target.value)}
            aria-label={`Role for ${member.name}`}
            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 uppercase outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:opacity-60"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          {error && <p className="mt-1 max-w-[12rem] text-xs text-red-500">{error}</p>}
        </div>
      ) : (
        // Your own row, or a member looking at anyone's: a plain badge,
        // never a control that would let you touch your own role.
        <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-500 uppercase">
          {role}
        </span>
      )}
    </li>
  );
}
