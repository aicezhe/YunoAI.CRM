import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Back to the list the row was clicked from. An explicit link rather than
 *  relying on the browser's back button, which is unavailable when the
 *  record was opened directly from a dashboard task. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-brand-600"
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      {label}
    </Link>
  );
}

/** A labelled value inside a record card. Absent values still render, so the
 *  card shows what is missing rather than quietly omitting the row. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-brand-200/40 py-3 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{children}</dd>
    </div>
  );
}

export function RecordCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-brand-200/70 bg-white p-6 shadow-sm">
      {title && <h2 className="mb-2 text-base font-semibold text-gray-900">{title}</h2>}
      {children}
    </section>
  );
}

export function Missing() {
  return <span className="font-normal text-gray-300">—</span>;
}
