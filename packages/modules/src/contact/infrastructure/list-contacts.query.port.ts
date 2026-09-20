import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Contact } from "../domain/index.js";

export type ListContactsQueryPort = (db: KyselyDB, scope: OrganizationScope) => Promise<Contact[]>;

export type ListContactsQueryPortFactory = () => ListContactsQueryPort;
