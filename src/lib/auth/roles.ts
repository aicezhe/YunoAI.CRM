export const APP_ROLES = ["admin", "member"] as const;

export type AppRole = (typeof APP_ROLES)[number];

/**
 * Everyone is a member unless something explicitly says otherwise.
 *
 * This is the safe direction to fail in: an unrecognised or missing role
 * under-grants access, never over-grants it. Admin-only work must therefore
 * always be gated on an explicit "admin", never on "not a member".
 */
export const DEFAULT_ROLE: AppRole = "member";

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

export function parseRole(value: unknown): AppRole {
  return isAppRole(value) ? value : DEFAULT_ROLE;
}
