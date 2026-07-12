import type { Organization } from "../domain/index.js";

export type { Organization };

export interface OrganizationRepoPort {
  get: (input: { slug: string }) => Promise<{ id: string; name: string } | null>;
}
