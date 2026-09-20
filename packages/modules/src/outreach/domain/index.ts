export type OutreachPlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type OutreachColumn = {
  id: string;
  organizationId: string;
  name: string;
  position: number;
};

export type OutreachCard = {
  id: string;
  organizationId: string;
  columnId: string;
  title: string;
  position: number;
  place: OutreachPlace | null;
  description: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: Date;
  createdBy: string;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type OutreachContact = {
  id: string;
  organizationId: string;
  name: string;
  phone: string | null;
  email: string | null;
  description: string | null;
};

export const DEFAULT_OUTREACH_COLUMN_NAMES = [
  "À contacter",
  "Contacté",
  "En discussion",
  "Refus",
  "Accepté",
];

/**
 * Computes the `position` value for an item being dropped between two neighbors
 * on a drag-and-drop-ordered list (Outreach Columns, and Outreach Cards within
 * a Column). `before`/`after` are the positions of the items now flanking the
 * drop spot, or null at either end of the list.
 */
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
