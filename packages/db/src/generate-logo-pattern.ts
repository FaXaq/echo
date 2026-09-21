const SIZE = 5;

// ponytail: binary-only pattern, no uniqueness enforcement — 2^25 combinations
// is fine at today's org counts, revisit if org count ever approaches millions.
export function generateLogoPattern(): number[][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => (Math.random() < 0.5 ? 1 : 0)),
  );
}
