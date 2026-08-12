export function exceedsLimit({
  current,
  delta,
  limit,
}: {
  current: number;
  delta: number;
  limit: number;
}) {
  return current + delta > limit;
}
