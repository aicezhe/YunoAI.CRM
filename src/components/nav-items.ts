import {
  CalendarCheck,
  FileText,
  Handshake,
  LayoutGrid,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Bottom-nav label, where six tabs share a phone's width. */
  shortLabel?: string;
  icon: LucideIcon;
  /** Rendered only for admins — by both nav variants, from this one flag. */
  adminOnly?: boolean;
};

/**
 * The app's sections, in nav order. Both the desktop Sidebar and the mobile
 * BottomNav read this list.
 *
 * Organizations and People used to be two entries; they are one Contacts
 * section with tabs now. Both are the same thing from the user's side —
 * someone you sell to — and splitting them meant guessing which list a name
 * was in before searching for it.
 *
 * Deals sits directly after Dashboard because it is the section people open
 * all day; Contracts is near the end because it is consulted, not worked.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutGrid },
  { href: "/deals", label: "Deals", icon: Handshake },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/activities", label: "Activities", shortLabel: "Activity", icon: CalendarCheck },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** True when `pathname` is the item's own route or anything nested under it,
 *  so /contacts/people still lights up Contacts. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
