/**
 * Nothing in the @modal slot for this URL — and, crucially, no interception
 * of it either.
 *
 * The slot's record routes are `[id]` segments, and a dynamic segment matches
 * any word. So /activities/open, /deals/new and friends — real routes sitting
 * at the same depth as an id — were being matched by the interceptor. That is
 * worse than it sounds: interception deliberately freezes the `children` slot
 * so the page underneath stays put while the overlay covers it, which meant
 * clicking "Activities" changed the URL, opened a card for an activity called
 * "open", and left the previous screen rendered behind it.
 *
 * A page here, WITHOUT a `(.)` marker, is an ordinary parallel-slot route. It
 * takes precedence over the interceptor for this exact path and does not
 * intercept, so `children` navigates normally and the slot renders nothing.
 *
 * Every static sibling of an intercepted `[id]` needs one of these. That is a
 * rule a person will eventually forget, so modal-routes.test.ts walks the
 * route tree and fails if one is missing.
 */
export function NoModal() {
  return null;
}
