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
  /** Prefix that decides the active state, when it differs from href.
   *  Contacts links straight at its first tab to save a redirect, but must
   *  still light up on the other one. */
  match?: string;
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
  { href: "/contacts/people", match: "/contacts", label: "Contacts", icon: Users },
  { href: "/activities/open", match: "/activities", label: "Activities", shortLabel: "Activity", icon: CalendarCheck },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * True when `pathname` is the item's own route or anything nested under it,
 * so /contacts/organizations still lights up Contacts.
 *
 * Takes the whole item rather than a href because the two differ for the
 * sections that link straight at a tab: pointing Contacts at /contacts would
 * cost a redirect on every click, and pointing it at /contacts/people alone
 * would leave the nav unlit while the Organizations tab is open.
 */
export function isActive(pathname: string, item: NavItem): boolean {
  const base = item.match ?? item.href;
  return pathname === base || pathname.startsWith(base + "/");
}
