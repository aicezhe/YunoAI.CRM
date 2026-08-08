/**
 * Shown while a section's Server Component resolves — which today means the
 * auth round-trip in the (app) layout. A skeleton in the page's own shape,
 * not a spinner, so the layout doesn't visibly reflow when content lands.
 */
export default function AppLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-5 py-8 sm:px-8 sm:py-10">
      <div className="h-9 w-48 rounded-lg bg-gray-200" />
      <div className="mt-3 h-4 w-64 max-w-full rounded bg-gray-100" />
      <div className="mt-8 h-64 rounded-3xl bg-white shadow-sm" />
    </div>
  );
}
