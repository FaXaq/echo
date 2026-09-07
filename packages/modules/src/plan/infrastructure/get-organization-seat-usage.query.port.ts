import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type GetOrganizationSeatUsageInput = {
  excludeInvitationId?: string;
};

export type GetOrganizationSeatUsageQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input?: GetOrganizationSeatUsageInput,
) => Promise<number>;

export type GetOrganizationSeatUsageQueryPortFactory = () => GetOrganizationSeatUsageQueryPort;
