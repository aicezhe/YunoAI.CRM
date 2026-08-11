/**
 * Shown while a section's Server Component resolves — which today means the
 * auth round-trip in the (app) layout. A skeleton in the page's own shape,
 * not a spinner, so the layout doesn't visibly reflow when content lands.
 * It fades in on a delay rather than appearing at once — see
 * `.skeleton-screen` in globals.css.
 */
export default function AppLoading() {
  return (
    <div className="skeleton-screen mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="skeleton h-7 w-44 rounded-lg" />
      <div className="skeleton-soft mt-3 h-3 w-60 max-w-full rounded" />
      {/* A card shell with bars inside, not one h-64 slab of colour: at that
          size a filled block stops reading as a placeholder and starts
          reading as a component that failed to render. */}
      <div className="mt-8 space-y-4 rounded-2xl border border-brand-200/70 bg-white p-7 shadow-card">
        {[88, 62, 74, 55].map((w, i) => (
          <div
            key={i}
            className={`h-3 rounded ${i === 0 ? "skeleton" : "skeleton-soft"}`}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}
