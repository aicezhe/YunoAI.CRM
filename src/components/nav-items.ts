import {
  Building2,
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
  /** Bottom-nav label. Seven tabs share a phone's width, so the long ones
   *  get a shorter form rather than being truncated mid-word. */
  shortLabel?: string;
  icon: LucideIcon;
  /** Rendered only for admins — by both nav variants, from this one flag. */
  adminOnly?: boolean;
};

/**
 * The app's sections, in nav order. Both the desktop Sidebar and the mobile
 * BottomNav read this list, so adding a section — or restricting one to
 * admins — is a single edit here rather than one per nav variant.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutGrid },
  { href: "/organizations", label: "Organizations", shortLabel: "Orgs", icon: Building2 },
  { href: "/people", label: "People", icon: Users },
  { href: "/deals", label: "Deals", icon: Handshake },
  { href: "/activities", label: "Activities", shortLabel: "Activity", icon: CalendarCheck },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** True when `pathname` is the item's own route or anything nested under it,
 *  so /organizations/42 still lights up Organizations. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
