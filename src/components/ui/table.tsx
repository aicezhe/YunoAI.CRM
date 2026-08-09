import Link from "next/link";

/**
 * The list surface: a white rounded card holding a real <table>.
 *
 * Cards-per-record were the previous shape and are wrong for working data —
 * six fields of a record take a whole card, so a screen shows five of them.
 * A table puts twenty rows in the same space and lines the values up, which
 * is the entire reason to look at a list.
 *
 * overflow-x-auto on the wrapper, not the page: a wide table scrolls inside
 * its own card on a phone instead of making the whole layout slide sideways.
 */
export function Table({ columns, children }: { columns: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-brand-200/70 bg-white shadow-sm">
      <table className="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-brand-200/70">
            {columns.map((c) => (
              <th
                key={c}
                scope="col"
                className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase"
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
 */
export function Row({ children }: { children: React.ReactNode }) {
  return (
    <tr className="relative border-b border-brand-200/40 transition-colors last:border-0 hover:bg-brand-100/60 focus-within:bg-brand-100/60">
      {children}
    </tr>
  );
}

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
    <td
      className={`px-5 py-3.5 ${muted ? "text-gray-500" : "text-gray-900"} ${className}`}
    >
      {children}
    </td>
  );
}

/** The row's primary cell. The `after:` pseudo-element stretches this one
 *  link across the entire row, so a click anywhere opens the record. */
export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <td className="px-5 py-3.5">
      <Link
        href={href}
        className="font-medium text-gray-900 after:absolute after:inset-0 after:content-[''] hover:text-brand-600 focus-visible:outline-none"
      >
        {children}
      </Link>
    </td>
  );
}

/** For values that are absent rather than empty — keeps columns aligned and
 *  says "nothing here" instead of leaving a hole. */
export function Blank() {
  return <span className="text-gray-300">—</span>;
}
