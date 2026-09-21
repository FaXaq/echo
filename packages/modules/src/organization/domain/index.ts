import { z } from "zod";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
  logoPattern: number[][];
};

const metadataSchema = z.object({ logoPattern: z.array(z.array(z.number())) }).partial();

// ponytail: better-auth returns organization.metadata already parsed to an
// object on some endpoints (createOrganization) and as a raw JSON string on
// others (listOrganizations, via its member-join path) — handle both.
export function parseLogoPattern(metadata: unknown): number[][] {
  const value = typeof metadata === "string" ? tryParseJson(metadata) : metadata;
  const parsed = metadataSchema.safeParse(value);
  return parsed.success ? (parsed.data.logoPattern ?? []) : [];
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export { generateOrgSlug } from "@echo/db/generate-org-slug";
export { generateLogoPattern } from "@echo/db/generate-logo-pattern";
