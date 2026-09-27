export function computeReorderPosition(neighbors: {
  before: number | null;
  after: number | null;
}): number {
  const { before, after } = neighbors;
  if (before === null && after === null) return 0;
  if (before === null) return (after ?? 0) - 1;
  if (after === null) return before + 1;
  return (before + after) / 2;
}
