"use client";

import { usePathname } from "next/navigation";
import { AddButton } from "@/components/ui/add-button";

/**
 * "Add contact" on the People tab, "Add organization" on the Organizations
 * one — the two tabs are different entities with different forms, so one
 * static button can't be right on both.
 *
 * A small client component reading its own pathname, the same trick `Tabs`
 * already uses — not the whole layout. `ContactsLayout` stays a Server
 * Component and its count fetch stays outside the client bundle; only this
 * one button re-evaluates on navigation, the header and tabs around it don't.
 */
export function ContactsAddButton() {
  const pathname = usePathname();

  return pathname.startsWith("/contacts/organizations") ? (
    <AddButton label="Add organization" href="/contacts/organizations/new" />
  ) : (
    <AddButton label="Add contact" href="/contacts/people/new" />
  );
}
