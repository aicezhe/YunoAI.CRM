import { describe, expect, it } from "vitest";
import { sortByPriority } from "@/lib/activity-order";
import type { ActivityRow } from "@/lib/data/types";

function activity(over: Partial<ActivityRow>): ActivityRow {
  return {
    id: "a1",
    type: "call",
    priority: "normal",
    subject: "Call",
    dueAt: "2026-08-12T10:00:00Z",
    done: false,
    dealId: null,
    dealTitle: null,
    personId: null,
    personName: null,
    organizationId: null,
    organizationName: null,
    ...over,
  };
}

describe("sortByPriority", () => {
  it("floats urgent activities to the top", () => {
    const rows = [
      activity({ id: "n1" }),
      activity({ id: "u1", priority: "urgent" }),
      activity({ id: "n2" }),
    ];
    expect(sortByPriority(rows).map((a) => a.id)).toEqual(["u1", "n1", "n2"]);
  });

  it("keeps the incoming order inside each priority group", () => {
    // The query already ordered by due date; the sort must not disturb that,
    // which is the whole reason it relies on Array#sort being stable.
    const rows = [
      activity({ id: "n1" }),
      activity({ id: "n2" }),
      activity({ id: "u1", priority: "urgent" }),
      activity({ id: "u2", priority: "urgent" }),
      activity({ id: "n3" }),
    ];
    expect(sortByPriority(rows).map((a) => a.id)).toEqual(["u1", "u2", "n1", "n2", "n3"]);
  });

  it("leaves a list with no urgent work exactly as it was", () => {
    const rows = [activity({ id: "a" }), activity({ id: "b" }), activity({ id: "c" })];
    expect(sortByPriority(rows).map((a) => a.id)).toEqual(["a", "b", "c"]);
  });
});
