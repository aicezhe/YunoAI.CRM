import Link from "next/link";
import { enterStyle } from "@/lib/stagger";

/**
 * The list surface: a white rounded card holding a real <table>.
 *
 * Cards-per-record were the previous shape and are wrong for working data —
 * six fields of a record take a whole card, so a screen shows five of them.
 * A table puts twenty rows in the same space and lines the values up, which
 * is the entire reason to look at a list.
 *
 * Ruled in both directions, not just between rows. Vertical separators are
 * what make a wide row scannable across: with horizontal rules alone the eye
 * loses which value belongs to which column somewhere around the fourth one.
 * They are drawn at low opacity in the brand hue rather than grey, so the
 * grid reads as structure and never competes with the content.
 *
 * overflow-x-auto on the wrapper, not the page: a wide table scrolls inside
 * its own card on a phone instead of making the whole layout slide sideways.
 *
 * `hidden md:block` on top of that rather than relying on overflow-x-auto
 * alone below md: sideways scroll works but reads as broken on a phone, and
 * every caller now renders a Card/CardLink list (see below) for that width
 * instead — this just has to get out of its way.
 */
export function Table({
  columns,
  children,
}: {
  /** Usually plain labels; a column can pass its own element (e.g. a
   *  clickable sort header) instead. Keyed by position, not content, since
   *  two columns can share a label and an element isn't a valid key. */
  columns: React.ReactNode[];
  children: React.ReactNode;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-3xl border border-brand-200/70 bg-white shadow-sm md:block">
      <table className="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          {/* A tinted band rather than plain white — it anchors the top of the
              grid and survives scrolling past on long lists. */}
          <tr className="border-b border-brand-200/70 bg-brand-50/70">
            {columns.map((c, i) => (
              <th
                key={i}
                scope="col"
                className="border-r border-brand-200/40 px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase last:border-r-0"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/**
 * A clickable row. `relative` pairs with the stretched anchor in RowLink so
 * the whole row is the click target while the accessible name stays the one
 * meaningful label — better than an onClick on <tr>, which is invisible to
 * keyboards and screen readers.
 *
 * Passing `index`/`count` staggers the row's arrival in with the rest of the
 * table — the same reveal every list in yuno-crm v1 used. Omit both and the
 * row renders static, for the rare table that isn't a full page's content
 * (nothing currently needs that, but the animation shouldn't be mandatory).
 */
export function Row({
  children,
  index,
  count,
}: {
  children: React.ReactNode;
  index?: number;
  count?: number;
}) {
  const animated = index !== undefined && count !== undefined;
  return (
    <tr
      className={
        "relative border-b border-brand-200/40 transition-colors last:border-0 hover:bg-brand-100/60 focus-within:bg-brand-100/60" +
        (animated ? " enter" : "")
      }
      style={animated ? enterStyle(index, count) : undefined}
    >
      {children}
    </tr>
  );
}

/** Shared by every cell, including the header's — one definition so a column
 *  rule never lands in one row and not the next. */
const RULE = "border-r border-brand-200/40 last:border-r-0";

export function Cell({
  children,
  muted = false,
  className = "",
}: {
  children: React.ReactNode;
  /** Secondary values — anything that isn't the row's identity. */
  muted?: boolean;
  className?: string;
}) {
  return (
    <td className={`${RULE} px-5 py-3 ${muted ? "text-gray-500" : "text-gray-900"} ${className}`}>
      {children}
    </td>
  );
}

/** The row's primary cell. The `after:` pseudo-element stretches this one
 *  link across the entire row, so a click anywhere opens the record. */
export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <td className={`${RULE} px-5 py-3`}>
      <Link
        href={href}
        className="font-medium text-gray-900 after:absolute after:inset-0 after:content-[''] hover:text-brand-600 focus-visible:outline-none"
      >
        {children}
      </Link>
    </td>
  );
}

/**
 * An email address, as a bordered chip.
 *
 * Chipped rather than plain text because an address is a thing you act on —
 * copy it, click it — and its outline marks where it starts and ends inside a
 * cell that is mostly whitespace. z-10 lifts it over the row's stretched
 * link, so clicking the address opens a mail client instead of the record.
 */
export function EmailChip({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="relative z-10 inline-flex max-w-full items-center truncate rounded-lg border border-brand-200 bg-brand-50/60 px-2 py-1 text-xs font-medium text-gray-700 transition hover:border-brand-300 hover:bg-brand-100 hover:text-brand-600"
    >
      {email}
    </a>
  );
}

/** A phone number, as a tel: link. Brand-coloured rather than grey: on a
 *  phone this is a one-tap call, and it should look like it does something. */
export function PhoneLink({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className="relative z-10 font-medium whitespace-nowrap text-brand-600 transition hover:underline"
    >
      {phone}
    </a>
  );
}

/** For values that are absent rather than empty — keeps columns aligned and
 *  says "nothing here" instead of leaving a hole. */
export function Blank() {
  return <span className="text-gray-300">—</span>;
}

/**
 * One record's mobile card — below md, this is the row: a table would need
 * horizontal scroll to show the same columns, which reads as broken on a
 * phone rather than merely inconvenient. Each row gets its own card, not one
 * shared list with internal dividers, so spacing between them (the caller's
 * `space-y-*` on the wrapping list) keeps them from blending together and
 * touch targets stay unambiguous.
 *
 * A plain positioned shell rather than a link: for rows that need a second
 * interactive element alongside the primary one (an email chip, a "related
 * to" link), the caller places its own stretched link — `after:absolute
 * after:inset-0 after:content-['']`, the same trick RowLink uses — plus any
 * secondary links marked `relative z-10` to sit above it, exactly mirroring
 * how RowLink and a Cell's z-10 link coexist as siblings in a table row. See
 * CardLink below for the simpler, more common case.
 */
export function Card({
  children,
  index,
  count,
}: {
  children: React.ReactNode;
  index?: number;
  count?: number;
}) {
  const animated = index !== undefined && count !== undefined;
  return (
    <div
      className={
        "relative rounded-2xl border border-brand-200/70 bg-white p-4 shadow-sm" +
        (animated ? " enter" : "")
      }
      style={animated ? enterStyle(index, count) : undefined}
    >
      {children}
    </div>
  );
}

/** A whole card as one link — for rows where nothing inside needs its own
 *  click target, so there's no reason to reach for Card's stretched-link
 *  pattern. */
export function CardLink({
  href,
  children,
  index,
  count,
}: {
  href: string;
  children: React.ReactNode;
  index?: number;
  count?: number;
}) {
  const animated = index !== undefined && count !== undefined;
  return (
    <Link
      href={href}
      className={
        "block rounded-2xl border border-brand-200/70 bg-white p-4 shadow-sm transition-colors hover:bg-brand-100/40 active:bg-brand-100/60" +
        (animated ? " enter" : "")
      }
      style={animated ? enterStyle(index, count) : undefined}
    >
      {children}
    </Link>
  );
}
