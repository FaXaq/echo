export interface OrganizationRepoPort {
  get: (input: { slug: string }) => Promise<{ id: string; name: string } | null>;
}
