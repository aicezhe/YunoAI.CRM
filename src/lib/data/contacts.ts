import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type OrganizationRow, type PersonRow, type Result } from "./types";

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
  id, name, industry, address, website,
  owner:users(name),
  persons(count)
`;

type RawOrganization = {
  id: string;
  name: string;
  industry: string | null;
  address: string | null;
  website: string | null;
  owner: { name: string } | null;
  persons: { count: number }[];
};

export async function listOrganizations(): Promise<Result<OrganizationRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(ORGANIZATION_SELECT)
    .order("name");

  if (error) return fail("listOrganizations", error.message);

  return ok(
    (data as unknown as RawOrganization[]).map((row) => ({
      id: row.id,
      name: row.name,
      industry: row.industry,
      address: row.address,
      website: row.website,
      ownerName: row.owner?.name ?? null,
      peopleCount: row.persons[0]?.count ?? 0,
    })),
  );
}

const PERSON_SELECT = `
  id, name, email, phone,
  organization:organizations(id, name),
  owner:users(name)
`;

type RawPerson = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
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
  if (!data) return ok(null);

  const row = data as unknown as RawOrganization;
  return ok({
    id: row.id,
    name: row.name,
    industry: row.industry,
    address: row.address,
    website: row.website,
    ownerName: row.owner?.name ?? null,
    peopleCount: row.persons[0]?.count ?? 0,
  });
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
