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

export type OutreachCardContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  description: string | null;
};

export const DEFAULT_OUTREACH_COLUMN_NAMES = [
  "To contact",
  "Contacted",
  "In discussion",
  "Rejected",
  "Accepted",
];
