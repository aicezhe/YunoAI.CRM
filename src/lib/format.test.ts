import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatDue, formatMoney, formatRelativeDay, formatTime } from "@/lib/format";

/**
 * Everything here depends on "now" or on the machine's timezone, so both are
 * pinned. Without that, `formatDate` hides the year for the current one and
 * these assertions would start failing on 1 January — the classic test that
 * passes for a year and then blames the wrong commit.
 */
process.env.TZ = "Europe/Rome";

afterEach(() => {
  vi.useRealTimers();
});

function pinNow(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

describe("formatMoney", () => {
  it("groups thousands with dots and puts the symbol in front", () => {
    expect(formatMoney(46000)).toBe("€46.000");
  });

  it("groups four-digit amounts too", () => {
    // Italian defaults to min2 grouping, which would render this "€9800" and
    // leave a column mixing €9800 and €46.000 — the same magnitude reading
    // as two different ones.
    expect(formatMoney(9800)).toBe("€9.800");
  });

  it("rounds away the cents", () => {
    expect(formatMoney(12499.6)).toBe("€12.500");
  });

  it("keeps the ISO code for anything that is not euro", () => {
    expect(formatMoney(12000, "USD")).toBe("USD 12.000");
  });

  it("shows a dash for a missing amount rather than zero", () => {
    // "€0" is a deal worth nothing; "—" is a deal nobody has priced yet.
    expect(formatMoney(null)).toBe("—");
    expect(formatMoney(0)).toBe("€0");
  });
});

describe("formatDate", () => {
  it("omits the year for dates in the current one", () => {
    pinNow("2026-08-11T09:00:00");
    expect(formatDate("2026-08-20")).toBe("20 Aug");
  });

  it("shows the year for every other date", () => {
    pinNow("2026-08-11T09:00:00");
    expect(formatDate("2025-12-31")).toBe("31 Dec 2025");
    expect(formatDate("2027-01-04")).toBe("4 Jan 2027");
  });

  it("shows a dash for a missing date", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatDue", () => {
  it("names today rather than printing a bare time", () => {
    // A row reading "14:30" in a date-sorted column looks misplaced — nothing
    // on it says which day it belongs to.
    pinNow("2026-08-11T09:00:00");
    expect(formatDue("2026-08-11T14:30:00")).toBe("Today, 14:30");
  });

  it("shows the date as well for any other day", () => {
    // A bare "14:30" on a row three weeks out reads as urgent.
    pinNow("2026-08-11T09:00:00");
    expect(formatDue("2026-09-01T14:30:00")).toBe("1 Sept, 14:30");
  });

  it("shows a dash when nothing is due", () => {
    expect(formatDue(null)).toBe("—");
  });
});

describe("formatTime", () => {
  it("pads to two digits on a 24-hour clock", () => {
    expect(formatTime("2026-08-11T09:05:00")).toBe("09:05");
  });
});

describe("formatRelativeDay", () => {
  it("names the moment rather than measuring the delay", () => {
    pinNow("2026-08-11T09:00:00");
    expect(formatRelativeDay("2026-08-11T07:00:00")).toBe("earlier today");
    expect(formatRelativeDay("2026-08-10T07:00:00")).toBe("yesterday");
    expect(formatRelativeDay("2026-08-08T07:00:00")).toBe("3 days ago");
  });
});
