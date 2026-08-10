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
      <div className="enter skeleton h-9 w-48 rounded-lg" />
      <div
        className="enter skeleton-soft mt-3 h-4 w-64 max-w-full rounded"
        style={{ "--enter-delay": "60ms" } as React.CSSProperties}
      />
      <div
        className="enter skeleton mt-8 h-64 rounded-2xl"
        style={{ "--enter-delay": "120ms" } as React.CSSProperties}
      />
    </div>
  );
}
