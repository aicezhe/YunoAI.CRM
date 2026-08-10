import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  fail,
  ok,
  type DeleteImpact,
  type OrganizationRow,
  type PersonRow,
  type Result,
} from "./types";

/**
 * PostgREST embeds a related table with `alias:table(cols)`. The `!fk` hint
 * after a table name names the foreign key to traverse — needed wherever two
 * paths exist between the same pair of tables, and harmless where one does.
 *
 * `persons(count)` asks Postgres for the aggregate rather than pulling every
 * related row back to count them here, which is the difference between one
 * number per organization and the whole contact list per organization.
 */
const ORGANIZATION_SELECT = `
  id, name, industry, address, website, owner_id,
  owner:users(name),
  persons(count)
`;

type RawOrganization = {
  id: string;
  name: string;
  industry: string | null;
  address: string | null;
  website: string | null;
  owner_id: string | null;
  owner: { name: string } | null;
  persons: { count: number }[];
};

function toOrganizationRow(row: RawOrganization): OrganizationRow {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    address: row.address,
    website: row.website,
    ownerId: row.owner_id,
    ownerName: row.owner?.name ?? null,
    peopleCount: row.persons[0]?.count ?? 0,
  };
}

export async function listOrganizations(): Promise<Result<OrganizationRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(ORGANIZATION_SELECT)
    .order("name");

  if (error) return fail("listOrganizations", error.message);

  return ok((data as unknown as RawOrganization[]).map(toOrganizationRow));
}

const PERSON_SELECT = `
  id, name, email, phone, owner_id,
  organization:organizations(id, name),
  owner:users(name)
`;

type RawPerson = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  owner_id: string | null;
  organization: { id: string; name: string } | null;
  owner: { name: string } | null;
};

function toPersonRow(row: RawPerson): PersonRow {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    organizationId: row.organization?.id ?? null,
    organizationName: row.organization?.name ?? null,
    ownerId: row.owner_id,
    ownerName: row.owner?.name ?? null,
  };
}

export async function listPersons(): Promise<Result<PersonRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("persons").select(PERSON_SELECT).order("name");

  if (error) return fail("listPersons", error.message);
  return ok((data as unknown as RawPerson[]).map(toPersonRow));
}

export async function getOrganization(id: string): Promise<Result<OrganizationRow | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(ORGANIZATION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return fail("getOrganization", error.message);
  return ok(data ? toOrganizationRow(data as unknown as RawOrganization) : null);
}

export async function getPerson(id: string): Promise<Result<PersonRow | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("persons")
    .select(PERSON_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return fail("getPerson", error.message);
  return ok(data ? toPersonRow(data as unknown as RawPerson) : null);
}

/** Contacts belonging to one organization — the list on its record card. */
export async function listPersonsForOrganization(orgId: string): Promise<Result<PersonRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("persons")
    .select(PERSON_SELECT)
    .eq("org_id", orgId)
    .order("name");

  if (error) return fail("listPersonsForOrganization", error.message);
  return ok((data as unknown as RawPerson[]).map(toPersonRow));
}

/** head + exact count: asks Postgres for the number and returns no rows at
 *  all, since every caller here only ever renders the count. */
async function countRows(
  table: "deals" | "activities" | "persons",
  column: string,
  id: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, id);
  return count ?? 0;
}

/** See {@link DeleteImpact}. Read on the record page so its delete control
 *  can say what will happen — and re-read inside the delete action itself,
 *  which is the check that actually decides. */
export async function getOrganizationDeleteImpact(id: string): Promise<DeleteImpact> {
  const [deals, activities, people] = await Promise.all([
    countRows("deals", "org_id", id),
    countRows("activities", "org_id", id),
    countRows("persons", "org_id", id),
  ]);
  return { deals, activities, people };
}

export async function getPersonDeleteImpact(id: string): Promise<DeleteImpact> {
  const [deals, activities] = await Promise.all([
    countRows("deals", "person_id", id),
    countRows("activities", "person_id", id),
  ]);
  return { deals, activities, people: 0 };
}
