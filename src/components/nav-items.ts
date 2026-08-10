import {
  CalendarCheck,
  FileText,
  Handshake,
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
  /**
   * How prominently the sidebar draws the item. "primary" is the all-day
   * working pair (Activities, Deals) — slightly larger and heavier, at the
   * top. "secondary" is consulted rather than worked. "system" is Settings:
   * muted, pinned to the bottom, visually apart from the work sections.
   * BottomNav ignores this — six equal tabs is the right shape on a phone.
   */
  tier: "primary" | "secondary" | "system";
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
 * Activities is first and is where sign-in lands: it is the list of what is
 * actually owed today, so it is both the most-opened section and the most
 * useful thing to be looking at on arrival. Deals follows because it is the
 * other all-day section; Contracts is near the end because it is consulted,
 * not worked.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/activities/open", match: "/activities", label: "Activities", shortLabel: "Activity", icon: CalendarCheck, tier: "primary" },
  { href: "/deals", label: "Deals", icon: Handshake, tier: "primary" },
  { href: "/contacts/people", match: "/contacts", label: "Contacts", icon: Users, tier: "secondary" },
  { href: "/contracts", label: "Contracts", icon: FileText, tier: "secondary" },
  { href: "/settings", label: "Settings", icon: Settings, tier: "system" },
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
