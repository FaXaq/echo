export const takeUniqueOrThrow = <T>(values: T[]): T => {
  if (values.length === 0) throw new Error("No value found");
  if (values.length !== 1) throw new Error("Found non unique value");
  return values[0]!;
};
