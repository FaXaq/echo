import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { PlanName } from "../domain/index.js";

export type ResolvePlanQueryPort = (db: KyselyDB, scope: OrganizationScope) => Promise<PlanName>;

export type ResolvePlanQueryPortFactory = () => ResolvePlanQueryPort;
