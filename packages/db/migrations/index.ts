import { Kysely } from "kysely";

import * as migration_20260719143454 from "./20260719143454_calendar-event";
import * as migration_20260725175919 from "./20260725175919_file";
import * as migration_20260804134238 from "./20260804134238_add-place-to-calendar-event";
import * as migration_20260805100203 from "./20260805100203_add-type-to-calendar-event";
import * as migration_20260806144831 from "./20260806144831_calendar-event-created-by-not-null";
import * as migration_20260808171103 from "./20260808171103_add-filename-to-file";
import * as migration_20260809190500 from "./20260809190500_backfill-personal-organizations";
import * as migration_20260809191500 from "./20260809191500_limit-one-personal-organization-per-user";
import * as migration_20260810103000 from "./20260810103000_calendar-event-organization-not-null";
import * as migration_20260811204527 from "./20260811204527_plan-quota-indexes";
import * as migration_20260811205325 from "./20260811205325_backfill-file-organization";
import * as migration_20260811210718 from "./20260811210718_file-organization-not-null";
import * as migration_20260816143813 from "./20260816143813_folder";
import * as migration_20260823180258 from "./20260823180258_song";
import * as migration_20260823180517 from "./20260823180517_add-song-id-to-file";
import * as migration_20260823180703 from "./20260823180703_file-event-id-set-null";
import * as migration_20260823192913 from "./20260823192913_song-updated-by-set-null";

type Migration = {
  up: (db: Kysely<any>) => Promise<void>;
  down: (db: Kysely<any>) => Promise<void>;
};

type Migrations = Record<string, Migration>;

export const migrations: Migrations = {
  "20260719143454_calendar-event": migration_20260719143454,
  "20260725175919_file": migration_20260725175919,
  "20260804134238_add-place-to-calendar-event": migration_20260804134238,
  "20260805100203_add-type-to-calendar-event": migration_20260805100203,
  "20260806144831_calendar-event-created-by-not-null": migration_20260806144831,
  "20260808171103_add-filename-to-file": migration_20260808171103,
  "20260809190500_backfill-personal-organizations": migration_20260809190500,
  "20260809191500_limit-one-personal-organization-per-user": migration_20260809191500,
  "20260810103000_calendar-event-organization-not-null": migration_20260810103000,
  "20260811204527_plan-quota-indexes": migration_20260811204527,
  "20260811205325_backfill-file-organization": migration_20260811205325,
  "20260811210718_file-organization-not-null": migration_20260811210718,
  "20260816143813_folder": migration_20260816143813,
  "20260823180258_song": migration_20260823180258,
  "20260823180517_add-song-id-to-file": migration_20260823180517,
  "20260823180703_file-event-id-set-null": migration_20260823180703,
  "20260823192913_song-updated-by-set-null": migration_20260823192913,
};
