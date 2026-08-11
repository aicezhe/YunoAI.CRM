import { describe, expect, it } from "vitest";
import { isRecordId } from "@/lib/record-id";

describe("isRecordId", () => {
  it("accepts a uuid", () => {
    expect(isRecordId("2fbb2964-ebeb-43d8-afb6-9753b8ca2bfb")).toBe(true);
    expect(isRecordId("2FBB2964-EBEB-43D8-AFB6-9753B8CA2BFB")).toBe(true);
  });

  // The regression this exists for: every one of these is a real route
  // sitting at the same depth as an [id], so the modal slot's dynamic segment
  // matched them and opened a record card for an activity called "open".
  it.each(["open", "archive", "new", "edit"])("rejects the sibling route %s", (segment) => {
    expect(isRecordId(segment)).toBe(false);
  });

  it("rejects anything uuid-shaped but not a uuid", () => {
    expect(isRecordId("2fbb2964-ebeb-43d8-afb6")).toBe(false);
    expect(isRecordId("2fbb2964ebeb43d8afb69753b8ca2bfb")).toBe(false);
    expect(isRecordId("zzzzzzzz-ebeb-43d8-afb6-9753b8ca2bfb")).toBe(false);
    expect(isRecordId("")).toBe(false);
  });
});
