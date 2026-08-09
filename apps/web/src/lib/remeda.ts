import { pipe, split, filter, map, join, take } from "remeda";

export const getInitials = (str: string | null | undefined, limit: number = -1) => {
  if (!str) return '';

  return pipe(
    str,
    split(' '),
    filter(word => word.length > 0),
    map(word => word[0]!.toUpperCase()),
    (initials) => limit !== -1 ? take(initials, limit) : initials,
    join('')
  );
};
