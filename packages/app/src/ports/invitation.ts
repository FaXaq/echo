export interface InvitationDetails {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  organizationName: string | null;
  organizationSlug: string | null;
}

export interface InvitationRepoPort {
  getById: (id: string) => Promise<InvitationDetails | null>;
}
