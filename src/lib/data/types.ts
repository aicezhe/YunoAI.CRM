export type DealStatus = "open" | "won" | "lost";
export type ActivityType = "call" | "meeting" | "email" | "task" | "note";

/**
 * Every list query returns this instead of throwing.
 *
 * A screen has three states to render — loading, empty, failed — and the
 * third is the one that gets skipped when queries throw, because the error
 * boundary swallows the whole page and the section loses its own shape. An
 * explicit `error` lets each screen keep its header and show the failure
 * where the table would be.
 */
// The `ok` flag is what makes this a usable discriminated union. Narrowing on
// `error` alone does not work: its failure type is `string`, and TypeScript
// can only discriminate a destructured union on a literal type — so `true` and
// `false` here are what let a screen write `if (!ok) …` and have `data` typed
// as present on the line after.
export type Result<T> =
  | { ok: true; data: T; error: null }
  | { ok: false; data: null; error: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data, error: null };
}

export function fail<T>(context: string, message: string): Result<T> {
  console.error(`[data] ${context}: ${message}`);
  // The database's own wording can name columns and constraints; the screen
  // shows something plain and the detail goes to the server log.
  return { ok: false, data: null, error: "Couldn't load this data. Try again in a moment." };
}

export type OrganizationRow = {
  id: string;
  name: string;
  industry: string | null;
  address: string | null;
  website: string | null;
  ownerName: string | null;
  peopleCount: number;
};

export type PersonRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  organizationId: string | null;
  organizationName: string | null;
  ownerName: string | null;
};

export type DealRow = {
  id: string;
  title: string;
  value: number | null;
  currency: string | null;
  status: DealStatus;
  stageId: string | null;
  stageName: string | null;
  stagePosition: number | null;
  expectedCloseDate: string | null;
  ownerId: string | null;
  ownerName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  personId: string | null;
  personName: string | null;
};

export type StageTransitionRow = {
  id: string;
  fromStageName: string | null;
  toStageName: string;
  changedByName: string | null;
  occurredAt: string;
};

export type ActivityRow = {
  id: string;
  type: ActivityType;
  subject: string;
  dueAt: string | null;
  done: boolean;
  dealId: string | null;
  dealTitle: string | null;
  personId: string | null;
  personName: string | null;
  organizationId: string | null;
  organizationName: string | null;
};

export type ContractRow = {
  id: string;
  dealId: string;
  dealTitle: string | null;
  signedDate: string;
  value: number | null;
  notes: string | null;
};
