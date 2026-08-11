/**
 * Shown while a section's Server Component resolves — which today means the
 * auth round-trip in the (app) layout. A skeleton in the page's own shape,
 * not a spinner, so the layout doesn't visibly reflow when content lands —
 * and it settles in with the same heading-then-body cascade every real page
 * uses, so even the wait moves like the app.
 */
export default function AppLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="enter skeleton h-7 w-44 rounded-lg" />
      <div
        className="enter skeleton-soft mt-3 h-3 w-60 max-w-full rounded"
        style={{ "--enter-delay": "60ms" } as React.CSSProperties}
      />
      {/* A card shell with bars inside, not one h-64 slab of colour: at that
          size a filled block stops reading as a placeholder and starts
          reading as a component that failed to render. */}
      <div
        className="enter mt-8 space-y-4 rounded-2xl border border-brand-200/70 bg-white p-7 shadow-card"
        style={{ "--enter-delay": "120ms" } as React.CSSProperties}
      >
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
