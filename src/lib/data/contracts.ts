import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ContractRow, type Result } from "./types";

type RawContract = {
  id: string;
  signed_date: string;
  value: string | number | null;
  notes: string | null;
  deal: { id: string; title: string } | null;
};

function toContractRow(row: RawContract): ContractRow {
  return {
    id: row.id,
    dealId: row.deal?.id ?? "",
    dealTitle: row.deal?.title ?? null,
    signedDate: row.signed_date,
    value: row.value === null ? null : Number(row.value),
    notes: row.notes,
  };
}

export async function listContracts(): Promise<Result<ContractRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, signed_date, value, notes, deal:deals(id, title)")
    .order("signed_date", { ascending: false });

  if (error) return fail("listContracts", error.message);
  return ok((data as unknown as RawContract[]).map(toContractRow));
}
