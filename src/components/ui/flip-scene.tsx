/**
 * Wraps a record page so it flips into place on arrival. See `.flip-scene`
 * and `.flip-in` in globals.css for the motion and the reasoning.
 *
 * Two elements rather than one because perspective has to be applied by an
 * ancestor of the thing that rotates; put on the rotating element itself it
 * produces a flat horizontal squash instead of depth.
 *
 * Plain CSS, no client component: this runs on a Server Component page and
 * should cost no JavaScript.
 */
export function FlipScene({ children }: { children: React.ReactNode }) {
  return (
    <div className="flip-scene">
      <div className="flip-in">{children}</div>
    </div>
  );
}
