/**
 * Demo content: organizations, contacts, deals, activities, contracts.
 *
 * Separate from seed-users.ts, which creates accounts. This one only fills
 * the CRM tables, so it can be re-run to reset the demo without touching
 * logins.
 *
 * Idempotent by wipe-and-rewrite: it deletes the rows it owns (in dependency
 * order) and inserts them again, so due dates stay relative to today rather
 * than drifting into the past.
 *
 *   npm run seed:demo
 */
import { createClient } from "@supabase/supabase-js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Fill in .env.local first.`);
    process.exit(1);
  }
  return value;
}

const db = createClient(required("SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Local-midnight-anchored offsets, so "today" means today in the viewer's
 *  timezone rather than 00:00 UTC. */
function at(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateOnly(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

async function main() {
  // Dependency order: children first, so foreign keys never block a delete.
  for (const table of ["contracts", "activities", "stage_transitions", "deals", "persons", "organizations"]) {
    const { error } = await db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`clearing ${table}: ${error.message}`);
  }

  const { data: users, error: usersError } = await db.from("users").select("id, name");
  if (usersError) throw new Error(usersError.message);
  const owner = (name: string) => users!.find((u) => u.name === name)?.id ?? null;

  const camillo = owner("Camillo");
  const anna = owner("Anna");
  const marco = owner("Marco");
  const giulia = owner("Giulia");

  const { data: stages, error: stagesError } = await db
    .from("pipeline_stages")
    .select("id, name");
  if (stagesError) throw new Error(stagesError.message);
  const stage = (name: string) => stages!.find((s) => s.name === name)?.id ?? null;

  const orgs = [
    { name: "Bellani Costruzioni", industry: "Construction", address: "Via Emilia 44, Parma", website: "bellani.it", owner_id: anna },
    { name: "Foodtech Padana", industry: "Food processing", address: "Strada Argini 108, Modena", website: "foodtechpadana.it", owner_id: marco },
    { name: "Marelli Logistica", industry: "Logistics", address: "Via Mantova 3, Reggio Emilia", website: "marellilog.it", owner_id: anna },
    { name: "Studio Ferrari & Partners", industry: "Legal", address: "Piazza Garibaldi 12, Parma", website: "ferraripartners.it", owner_id: giulia },
    { name: "Verdi Energia", industry: "Renewables", address: "Via Trento 71, Bologna", website: "verdienergia.it", owner_id: marco },
    { name: "Rossi Manifattura", industry: "Manufacturing", address: "Via Po 9, Piacenza", website: "rossimanifattura.it", owner_id: camillo },
  ];
  const { data: orgRows, error: orgError } = await db.from("organizations").insert(orgs).select("id, name");
  if (orgError) throw new Error(`organizations: ${orgError.message}`);
  const org = (name: string) => orgRows!.find((o) => o.name === name)!.id;

  const people = [
    { name: "Luca Bellani", org_id: org("Bellani Costruzioni"), email: "l.bellani@bellani.it", phone: "+39 0521 448 220", owner_id: anna },
    { name: "Chiara Neri", org_id: org("Bellani Costruzioni"), email: "c.neri@bellani.it", phone: "+39 0521 448 231", owner_id: anna },
    { name: "Davide Fontana", org_id: org("Foodtech Padana"), email: "d.fontana@foodtechpadana.it", phone: "+39 059 771 004", owner_id: marco },
    { name: "Sara Marelli", org_id: org("Marelli Logistica"), email: "s.marelli@marellilog.it", phone: "+39 0522 310 887", owner_id: anna },
    { name: "Avv. Paolo Ferrari", org_id: org("Studio Ferrari & Partners"), email: "p.ferrari@ferraripartners.it", phone: "+39 0521 233 190", owner_id: giulia },
    { name: "Elena Verdi", org_id: org("Verdi Energia"), email: "e.verdi@verdienergia.it", phone: "+39 051 604 220", owner_id: marco },
    { name: "Matteo Rossi", org_id: org("Rossi Manifattura"), email: "m.rossi@rossimanifattura.it", phone: "+39 0523 712 004", owner_id: camillo },
    { name: "Giorgia Conti", org_id: org("Foodtech Padana"), email: "g.conti@foodtechpadana.it", phone: "+39 059 771 019", owner_id: marco },
    { name: "Alessandro Riva", org_id: org("Marelli Logistica"), email: "a.riva@marellilog.it", phone: null, owner_id: giulia },
    // Deliberately unattached: an individual lead with no company yet, which
    // the schema allows and the People list has to render without an org.
    { name: "Federica Lombardi", org_id: null, email: "f.lombardi@gmail.com", phone: "+39 348 220 1180", owner_id: anna },
  ];
  const { data: personRows, error: personError } = await db.from("persons").insert(people).select("id, name");
  if (personError) throw new Error(`persons: ${personError.message}`);
  const person = (name: string) => personRows!.find((p) => p.name === name)!.id;

  const deals = [
    { title: "Gestionale cantieri — 40 postazioni", org_id: org("Bellani Costruzioni"), person_id: person("Luca Bellani"), owner_id: anna, value: 28500, currency: "EUR", stage_id: stage("Proposal"), status: "open", expected_close_date: dateOnly(21) },
    { title: "Tracciabilità lotti produzione", org_id: org("Foodtech Padana"), person_id: person("Davide Fontana"), owner_id: marco, value: 46000, currency: "EUR", stage_id: stage("Negotiation"), status: "open", expected_close_date: dateOnly(12) },
    { title: "Rinnovo licenze annuale", org_id: org("Marelli Logistica"), person_id: person("Sara Marelli"), owner_id: anna, value: 12400, currency: "EUR", stage_id: stage("Qualified"), status: "open", expected_close_date: dateOnly(35) },
    { title: "Portale clienti studio legale", org_id: org("Studio Ferrari & Partners"), person_id: person("Avv. Paolo Ferrari"), owner_id: giulia, value: 18900, currency: "EUR", stage_id: stage("Demo"), status: "open", expected_close_date: dateOnly(28) },
    { title: "Monitoraggio impianti fotovoltaici", org_id: org("Verdi Energia"), person_id: person("Elena Verdi"), owner_id: marco, value: 63000, currency: "EUR", stage_id: stage("Proposal"), status: "open", expected_close_date: dateOnly(45) },
    { title: "MES linea assemblaggio", org_id: org("Rossi Manifattura"), person_id: person("Matteo Rossi"), owner_id: camillo, value: 87000, currency: "EUR", stage_id: stage("Negotiation"), status: "open", expected_close_date: dateOnly(18) },
    { title: "Formazione team commerciale", org_id: org("Bellani Costruzioni"), person_id: person("Chiara Neri"), owner_id: anna, value: 4200, currency: "EUR", stage_id: stage("Lead"), status: "open", expected_close_date: dateOnly(60) },
    { title: "App mobile autisti", org_id: org("Marelli Logistica"), person_id: person("Alessandro Riva"), owner_id: giulia, value: 22000, currency: "EUR", stage_id: stage("Lead"), status: "open", expected_close_date: dateOnly(75) },
    { title: "Integrazione ERP magazzino", org_id: org("Foodtech Padana"), person_id: person("Giorgia Conti"), owner_id: marco, value: 31500, currency: "EUR", stage_id: stage("Demo"), status: "open", expected_close_date: dateOnly(40) },
    { title: "Consulenza individuale", org_id: null, person_id: person("Federica Lombardi"), owner_id: anna, value: 2800, currency: "EUR", stage_id: stage("Qualified"), status: "open", expected_close_date: dateOnly(14) },
    { title: "Manutenzione evolutiva 2026", org_id: org("Rossi Manifattura"), person_id: person("Matteo Rossi"), owner_id: camillo, value: 15000, currency: "EUR", stage_id: stage("Won"), status: "won", expected_close_date: dateOnly(-20) },
    { title: "Sistema qualità ISO", org_id: org("Verdi Energia"), person_id: person("Elena Verdi"), owner_id: marco, value: 9800, currency: "EUR", stage_id: stage("Lost"), status: "lost", lost_reason: "Scelto un fornitore locale", expected_close_date: dateOnly(-8) },
  ];
  const { data: dealRows, error: dealError } = await db.from("deals").insert(deals).select("id, title");
  if (dealError) throw new Error(`deals: ${dealError.message}`);
  const deal = (title: string) => dealRows!.find((d) => d.title === title)!.id;

  // priority is left off most rows so the column default ('normal') fills
  // them in. Two are urgent on purpose: one overdue and one due furthest
  // out, so the open list demonstrates both halves of its sort — urgent
  // first, and by due date inside each group.
  // Only the finished rows carry completed_by/completed_at. A bulk insert
  // unions its keys, so the rows that omit them send an explicit NULL —
  // which is exactly right here (an open activity must have neither, and
  // activities_completion_matches_done enforces it). Worth stating because
  // that same union broke this seed once, when the omitted column had a
  // NOT NULL default rather than accepting null.
  const activities = [
    // Overdue.
    { type: "call", subject: "Richiamare per conferma budget", priority: "urgent", deal_id: deal("Gestionale cantieri — 40 postazioni"), person_id: person("Luca Bellani"), org_id: org("Bellani Costruzioni"), due_at: at(-2, 11), done: false, created_by: anna },
    { type: "email", subject: "Inviare contratto rivisto", priority: "normal", deal_id: deal("Tracciabilità lotti produzione"), person_id: person("Davide Fontana"), org_id: org("Foodtech Padana"), due_at: at(-1, 16), done: false, created_by: marco },

    // Today.
    { type: "meeting", subject: "Demo portale clienti", priority: "normal", deal_id: deal("Portale clienti studio legale"), person_id: person("Avv. Paolo Ferrari"), org_id: org("Studio Ferrari & Partners"), due_at: at(0, 10), done: false, created_by: giulia },
    { type: "call", subject: "Allineamento su tempi di consegna", priority: "normal", deal_id: deal("MES linea assemblaggio"), person_id: person("Matteo Rossi"), org_id: org("Rossi Manifattura"), due_at: at(0, 14, 30), done: false, created_by: camillo },
    { type: "task", subject: "Preparare preventivo impianti", priority: "normal", deal_id: deal("Monitoraggio impianti fotovoltaici"), person_id: person("Elena Verdi"), org_id: org("Verdi Energia"), due_at: at(0, 17), done: false, created_by: marco },

    // Upcoming — deliberately spread past the end of the month, so the date
    // column has to render more than one month and the sort has something to
    // sort. All relative to the run date: the demo never goes stale.
    { type: "meeting", subject: "Sopralluogo magazzino", priority: "normal", deal_id: deal("Integrazione ERP magazzino"), person_id: person("Giorgia Conti"), org_id: org("Foodtech Padana"), due_at: at(2, 9, 30), done: false, created_by: marco },
    { type: "call", subject: "Primo contatto", priority: "normal", deal_id: deal("App mobile autisti"), person_id: person("Alessandro Riva"), org_id: org("Marelli Logistica"), due_at: at(9, 15), done: false, created_by: giulia },
    { type: "task", subject: "Raccogliere requisiti formazione", priority: "urgent", deal_id: deal("Formazione team commerciale"), person_id: person("Chiara Neri"), org_id: org("Bellani Costruzioni"), due_at: at(4, 11), done: false, created_by: anna },

    { type: "meeting", subject: "Revisione trimestrale contratto", priority: "normal", deal_id: deal("Rinnovo licenze annuale"), person_id: person("Sara Marelli"), org_id: org("Marelli Logistica"), due_at: at(20, 10), done: false, created_by: anna },
    { type: "task", subject: "Preparare offerta rinnovo", priority: "normal", deal_id: deal("Monitoraggio impianti fotovoltaici"), person_id: person("Elena Verdi"), org_id: org("Verdi Energia"), due_at: at(28, 14, 30), done: false, created_by: giulia },

    // Done, and notes with no due date at all.
    { type: "call", subject: "Chiamata di qualifica", priority: "normal", deal_id: deal("Rinnovo licenze annuale"), person_id: person("Sara Marelli"), org_id: org("Marelli Logistica"), due_at: at(-4, 10), done: true, created_by: anna, completed_by: anna, completed_at: at(-4, 11) },
    { type: "meeting", subject: "Kickoff progetto", priority: "normal", deal_id: deal("Manutenzione evolutiva 2026"), person_id: person("Matteo Rossi"), org_id: org("Rossi Manifattura"), due_at: at(-15, 9), done: true, created_by: camillo, completed_by: camillo, completed_at: at(-15, 10) },
    { type: "note", subject: "Preferiscono fatturazione trimestrale", priority: "normal", deal_id: deal("Tracciabilità lotti produzione"), person_id: person("Davide Fontana"), org_id: org("Foodtech Padana"), due_at: null, done: false, created_by: marco },
    { type: "note", subject: "Contatto arrivato da referral", priority: "normal", deal_id: null, person_id: person("Federica Lombardi"), org_id: null, due_at: null, done: false, created_by: anna },
    { type: "email", subject: "Follow-up post demo", priority: "normal", deal_id: deal("Portale clienti studio legale"), person_id: person("Avv. Paolo Ferrari"), org_id: org("Studio Ferrari & Partners"), due_at: at(-6, 12), done: true, created_by: giulia, completed_by: marco, completed_at: at(-5, 9) },
  ];
  const { error: activityError } = await db.from("activities").insert(activities);
  if (activityError) throw new Error(`activities: ${activityError.message}`);

  const contracts = [
    { deal_id: deal("Manutenzione evolutiva 2026"), signed_date: dateOnly(-20), value: 15000, notes: "Rinnovo automatico salvo disdetta 60 giorni" },
    { deal_id: deal("Rinnovo licenze annuale"), signed_date: dateOnly(-120), value: 11800, notes: "Contratto precedente, in scadenza" },
  ];
  const { error: contractError } = await db.from("contracts").insert(contracts);
  if (contractError) throw new Error(`contracts: ${contractError.message}`);

  console.log(
    `Seeded: ${orgs.length} organizations, ${people.length} people, ${deals.length} deals, ` +
      `${activities.length} activities, ${contracts.length} contracts.`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
