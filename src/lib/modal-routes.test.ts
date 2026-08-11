import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the one thing about the flip-open record panel that a person will
 * forget: every static route sitting beside an intercepted `[id]` needs a
 * do-nothing page in the @modal slot.
 *
 * Without it the slot's `[id]` matches the word — /activities/open,
 * /deals/new — and interception freezes the page underneath, so the section
 * silently stops navigating. It shipped exactly once, on production, and the
 * only reason it was caught is that the failing query wrote a uuid parse
 * error into the server log.
 *
 * This walks the real route tree rather than restating a list, so a route
 * added next month is covered without anyone remembering this file exists.
 */

const APP = join(process.cwd(), "src/app/(app)");
const MODAL = join(APP, "@modal");

function dirs(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

/** Every intercepting route in the slot, as the app path it intercepts —
 *  "(.)contacts/people/[id]" describes /contacts/people/[id]. */
function interceptedIdRoutes(dir = MODAL, prefix: string[] = []): string[][] {
  const found: string[][] = [];
  for (const name of dirs(dir)) {
    const segment = name.replace(/^\(\.+\)/, "");
    const path = [...prefix, segment];
    if (segment === "[id]") found.push(path);
    else found.push(...interceptedIdRoutes(join(dir, name), path));
  }
  return found;
}

describe("@modal slot", () => {
  const intercepted = interceptedIdRoutes();

  it("intercepts at least one record route", () => {
    // Guards against the walker silently finding nothing and the suite
    // passing while checking no routes at all.
    expect(intercepted.length).toBeGreaterThan(0);
  });

  it.each(intercepted.map((p) => [p.join("/"), p] as const))(
    "has a do-nothing slot page for every static sibling of %s",
    (_label, path) => {
      const parent = path.slice(0, -1);
      const siblings = dirs(join(APP, ...parent)).filter(
        (name) => !name.startsWith("[") && !name.startsWith("("),
      );

      const missing = siblings.filter(
        (name) => !existsSync(join(MODAL, ...parent, name, "page.tsx")),
      );

      expect(missing, `add src/app/(app)/@modal/${[...parent, ...missing].join("/")}/page.tsx`).toEqual([]);
    },
  );
});
