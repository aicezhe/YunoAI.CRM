import { describe, expect, it } from "vitest";
import { enterStyle, staggerDelayMs } from "@/lib/stagger";

describe("staggerDelayMs", () => {
  it("starts the first row immediately", () => {
    expect(staggerDelayMs(0, 10)).toBe(0);
  });

  it("gives a short list the full per-row gap", () => {
    // 55ms is squarely in the band where a cascade reads as intentional.
    expect(staggerDelayMs(1, 5)).toBe(55);
    expect(staggerDelayMs(4, 5)).toBe(220);
  });

  it("keeps a long list inside the reveal budget", () => {
    // At a flat 55ms/row the last of fifty rows would arrive 2.7s in, which
    // reads as a slow app rather than a polished one.
    expect(staggerDelayMs(49, 50)).toBeLessThanOrEqual(600);
  });

  it("never returns a negative or NaN delay for an empty list", () => {
    expect(staggerDelayMs(0, 0)).toBe(0);
  });
});

describe("enterStyle", () => {
  it("emits the CSS variable the .enter class reads", () => {
    expect(enterStyle(2, 5)).toEqual({ "--enter-delay": "110ms" });
  });
});
