/**
 * Remounts on every navigation — that is the one thing a template does that
 * a layout doesn't — so the `.route-enter` animation replays each time the
 * route changes. The sidebar and bottom nav live in layout.tsx and are
 * untouched by it: only the content area fades in.
 *
 * A server component with a CSS animation rather than a client motion
 * wrapper: the effect is identical, and this way route transitions add zero
 * client JavaScript to every page.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
