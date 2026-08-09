/**
 * Per-row entrance delay for a freshly rendered list.
 *
 * The formula and both constants are carried over from yuno-crm v1's search
 * results grid (search-client.tsx), which staggered cards in with
 * framer-motion using the same budget/cap trade-off: a fixed per-row delay
 * looks right for five rows and wrong for fifty — at a flat 70ms/row, a
 * 50-row table would still be revealing itself 3.5s after the data arrived,
 * which reads as the app being slow rather than polished.
 *
 * Capping the per-row delay at BUDGET/count instead keeps the whole list's
 * reveal within REVEAL_BUDGET_MS regardless of length, while short lists
 * still get the full, noticeable MAX_STAGGER_MS between rows.
 */
const REVEAL_BUDGET_MS = 500;
const MAX_STAGGER_MS = 70;

export function staggerDelayMs(index: number, count: number): number {
  const perRow = Math.min(MAX_STAGGER_MS, REVEAL_BUDGET_MS / Math.max(count, 1));
  return Math.round(index * perRow);
}

/** Ready to spread onto a `style` prop: `<Row style={enterStyle(i, n)}>`. */
export function enterStyle(index: number, count: number): React.CSSProperties {
  return { "--enter-delay": `${staggerDelayMs(index, count)}ms` } as React.CSSProperties;
}
