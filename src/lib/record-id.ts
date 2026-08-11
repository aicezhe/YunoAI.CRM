/**
 * Does this URL segment name a record, or is it a word?
 *
 * The intercepting routes under (app)/@modal are `[id]` segments, and a
 * dynamic segment matches anything — including the sibling routes that sit at
 * the same depth and are not records at all: /activities/open,
 * /activities/archive, /deals/new, /contacts/people/new. In the real route
 * tree those never collide, because a static segment always beats a dynamic
 * one; inside the slot there is no static route to win, so `[id]` swallowed
 * them and the modal tried to load an activity called "open".
 *
 * Checking the shape rather than listing the words on purpose. A list would
 * have to be kept in step with every route added later, and the failure mode
 * of forgetting is another section of the app opening as a broken card. An id
 * is a uuid or it is not a record, and that stays true whatever gets added
 * next.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRecordId(segment: string): boolean {
  return UUID.test(segment);
}
