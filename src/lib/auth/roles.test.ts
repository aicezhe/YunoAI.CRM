import { describe, expect, it } from "vitest";
import { DEFAULT_ROLE, isAppRole, parseRole } from "@/lib/auth/roles";

describe("parseRole", () => {
  it("passes through the roles the app knows", () => {
    expect(parseRole("admin")).toBe("admin");
    expect(parseRole("member")).toBe("member");
  });

  it("falls back to member for anything else", () => {
    // The direction matters: an unreadable role must under-grant access, so
    // a typo, a renamed role or a null column can never mint an admin.
    expect(parseRole("owner")).toBe("member");
    expect(parseRole("Admin")).toBe("member");
    expect(parseRole(null)).toBe("member");
    expect(parseRole(undefined)).toBe("member");
    expect(parseRole(1)).toBe("member");
    expect(parseRole({ role: "admin" })).toBe("member");
  });

  it("has member as the documented default", () => {
    expect(DEFAULT_ROLE).toBe("member");
  });
});

describe("isAppRole", () => {
  it("accepts only exact matches", () => {
    expect(isAppRole("admin")).toBe(true);
    expect(isAppRole("administrator")).toBe(false);
    expect(isAppRole(["admin"])).toBe(false);
  });
});
