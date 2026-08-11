/**
 * Nothing in the slot unless an intercepting route fills it.
 *
 * Required, not optional: without a default.tsx a parallel slot that has no
 * match for the current URL renders a 404 for the whole page — so every route
 * that is not a record would break the moment the slot exists.
 */
export default function ModalDefault() {
  return null;
}
