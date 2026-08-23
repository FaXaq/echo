import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song } from "../domain/index.js";

export type ListSongsQueryPort = (db: KyselyDB, scope: OrganizationScope) => Promise<Song[]>;

export type ListSongsQueryPortFactory = () => ListSongsQueryPort;
