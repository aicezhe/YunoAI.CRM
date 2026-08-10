/**
 * Shown while a section's Server Component resolves — which today means the
 * auth round-trip in the (app) layout. A skeleton in the page's own shape,
 * not a spinner, so the layout doesn't visibly reflow when content lands.
 */
export default function AppLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="skeleton h-9 w-48 rounded-lg" />
      <div className="skeleton-soft mt-3 h-4 w-64 max-w-full rounded" />
      <div className="skeleton mt-8 h-64 rounded-2xl" />
    </div>
  );
}
