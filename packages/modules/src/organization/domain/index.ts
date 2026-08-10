export type Organization = {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
};

export { generateOrgSlug } from "@echo/db/generate-org-slug";
