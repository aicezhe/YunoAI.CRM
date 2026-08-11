import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Pure logic only: no database, no network, no rendered components. That is
 * a deliberate line rather than a first step — `npm test` stays a tight loop
 * and runs anywhere without secrets or a Supabase project.
 *
 * What it leaves out, and why that is the right trade here: the queries are
 * mostly one PostgREST call each, so a test would assert that the client was
 * called the way the test itself was written to expect — it would restate
 * the implementation, not check it. The rules the queries *do* carry that
 * can genuinely be wrong are the ones lifted into plain functions
 * (deals-view, activity-order, format), and those are covered below. The
 * database's own invariants are enforced by CHECK constraints, which are
 * tested by the database refusing to write the row.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // Mirrors the "@/*" path in tsconfig.json — without it every import
    // inside the modules under test fails to resolve.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
