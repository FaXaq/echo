const organizationScopeBrand = Symbol("OrganizationScope");

export type OrganizationScope = {
  readonly organizationId: string;
  readonly [organizationScopeBrand]: true;
};

export function createOrganizationScope(organizationId: string): OrganizationScope {
  return { organizationId, [organizationScopeBrand]: true };
}

export function createSystemOrganizationScope(organizationId: string): OrganizationScope {
  return { organizationId, [organizationScopeBrand]: true };
}
