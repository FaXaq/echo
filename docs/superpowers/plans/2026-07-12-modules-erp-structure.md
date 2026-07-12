# Align packages/modules structure and DB transactions with erp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure every module under `packages/modules/src/<name>/` from one-file-per-concern (`use-cases/index.ts`, `infrastructure/index.ts`) to erp's granular layout (`app/` one-file-per-use-case, `infrastructure/` port+adapter split), and thread an explicit `db: KyselyDB` parameter through every repository method so use cases can compose atomic transactions across repositories.

**Architecture:** Mechanical, behavior-preserving refactor applied identically to 11 modules (`track`, `organization`, `song`, `song-section`, `file`, `audio-clip`, `midi-clip`, `invitation`, `health`, `user`, `notification`). No schema changes. `KyselyDB` (already exported from `@echo/db`) is reused as the shared executor type for both the root connection and an open transaction, since `Transaction<DB> extends Kysely<DB>` — no new wrapper type is needed.

**Tech Stack:** TypeScript 5.x, Kysely 0.27, tRPC, Fastify, pnpm workspaces / Turborepo.

## Global Constraints

- No database schema or migration changes.
- No new cross-repo transactional *use case* is introduced — only the capability. Existing behavior (including the single internal `.transaction()` call in `track.reorder`) is preserved as-is.
- Repo factories keep any non-`db` constructor deps they already had (`auth`, `headers`, `mailer`, `appBaseUrl`); only `db` moves from constructor to a per-call parameter.
- Use cases are flattened from curried `makeX = (deps) => (input) => ...` to plain `export async function x(deps, input) { ... }`, one per file, under `app/` (not `use-cases/`).
- Every module's `infrastructure/index.ts` becomes a barrel re-exporting a `*.port.ts` (interface only) and a `*.kysely.ts` / `*.better-auth.ts` / `*.s3.ts` / `*.nodemailer.ts` (adapter), named after the underlying technology.
- `packages/modules/package.json` exports map: every `"./<module>/use-cases"` entry is renamed to `"./<module>/app"` pointing at `./src/<module>/app/index.ts`.
- Verify each task with `pnpm --filter @echo/modules typecheck` and, once a router changes, `pnpm --filter @echo/api typecheck`. There are no existing unit tests under `packages/modules` — do not add a new test suite as part of this refactor.
- Reference design doc: `docs/superpowers/specs/2026-07-12-modules-erp-structure-design.md`.

---

## Task 1: `track` module (reference implementation)

This task establishes the pattern every later task repeats.

**Files:**
- Create: `packages/modules/src/track/infrastructure/track-repository.port.ts`
- Create: `packages/modules/src/track/infrastructure/track-repository.kysely.ts`
- Modify: `packages/modules/src/track/infrastructure/index.ts`
- Create: `packages/modules/src/track/app/list-tracks.ts`
- Create: `packages/modules/src/track/app/create-track.ts`
- Create: `packages/modules/src/track/app/update-track-volume.ts`
- Create: `packages/modules/src/track/app/set-track-instrument-preset.ts`
- Create: `packages/modules/src/track/app/delete-track.ts`
- Create: `packages/modules/src/track/app/rename-track.ts`
- Create: `packages/modules/src/track/app/reorder-tracks.ts`
- Create: `packages/modules/src/track/app/index.ts`
- Delete: `packages/modules/src/track/use-cases/index.ts` (remove the now-empty `use-cases/` directory)
- Modify: `packages/modules/package.json`
- Modify: `apps/api/src/router/organizations/track.ts`
- Modify: `apps/api/src/context.ts`

**Interfaces:**
- Consumes: `Track` domain type from `packages/modules/src/track/domain/index.ts` (unchanged), `KyselyDB` from `@echo/db`.
- Produces: `TrackRepoPort` (every method takes `db: KyselyDB` first), `makeTrackRepo()` (no args), and 7 exported async functions (`listTracks`, `createTrack`, `updateTrackVolume`, `setTrackInstrumentPreset`, `deleteTrack`, `renameTrack`, `reorderTracks`), each `(deps, input)`.

- [ ] **Step 1: Create the port file**

`packages/modules/src/track/infrastructure/track-repository.port.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { Track } from "../domain/index.js";

export type { Track };

export interface TrackRepoPort {
  list: (db: KyselyDB, input: { songId: string }) => Promise<Track[]>;
  findById: (db: KyselyDB, input: { trackId: string }) => Promise<Track | null>;
  create: (
    db: KyselyDB,
    input: { id: string; songId: string; name: string; volume: number; order: number },
  ) => Promise<Track>;
  updateVolume: (db: KyselyDB, input: { trackId: string; volumeDb: number }) => Promise<Track>;
  setInstrumentPreset: (
    db: KyselyDB,
    input: { trackId: string; preset: number | null },
  ) => Promise<Track>;
  delete: (db: KyselyDB, input: { trackId: string }) => Promise<void>;
  rename: (db: KyselyDB, input: { trackId: string; name: string }) => Promise<Track>;
  reorder: (db: KyselyDB, input: { orderedTrackIds: string[] }) => Promise<void>;
}
```

- [ ] **Step 2: Create the Kysely adapter**

`packages/modules/src/track/infrastructure/track-repository.kysely.ts`:

```ts
import type { Track } from "../domain/index.js";
import type { TrackRepoPort } from "./track-repository.port.js";

export const makeTrackRepo = (): TrackRepoPort => ({
  list: async (db, { songId }) => {
    const rows = await db
      .selectFrom("track")
      .selectAll()
      .where("songId", "=", songId)
      .orderBy("order", "asc")
      .execute();
    return rows.map(toTrack);
  },

  findById: async (db, { trackId }) => {
    const row = await db
      .selectFrom("track")
      .selectAll()
      .where("id", "=", trackId)
      .executeTakeFirst();
    return row ? toTrack(row) : null;
  },

  create: async (db, { id, songId, name, volume, order }) => {
    const row = await db
      .insertInto("track")
      .values({ id, songId, name, volume, order })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  updateVolume: async (db, { trackId, volumeDb }) => {
    const row = await db
      .updateTable("track")
      .set({ volume: volumeDb, updatedAt: new Date() })
      .where("id", "=", trackId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  setInstrumentPreset: async (db, { trackId, preset }) => {
    const row = await db
      .updateTable("track")
      .set({ instrumentPreset: preset, updatedAt: new Date() })
      .where("id", "=", trackId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  delete: async (db, { trackId }) => {
    await db.deleteFrom("track").where("id", "=", trackId).execute();
  },

  rename: async (db, { trackId, name }) => {
    const row = await db
      .updateTable("track")
      .set({ name, updatedAt: new Date() })
      .where("id", "=", trackId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  reorder: async (db, { orderedTrackIds }) => {
    await db.transaction().execute(async (trx) => {
      for (let i = 0; i < orderedTrackIds.length; i++) {
        await trx
          .updateTable("track")
          .set({ order: i, updatedAt: new Date() })
          .where("id", "=", orderedTrackIds[i])
          .execute();
      }
    });
  },
});

function toTrack(row: {
  id: string;
  songId: string;
  name: string;
  volume: number;
  instrumentPreset: number | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): Track {
  return {
    id: row.id,
    songId: row.songId,
    name: row.name,
    volume: row.volume,
    instrumentPreset: row.instrumentPreset ?? null,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
```

- [ ] **Step 3: Rewrite the infrastructure barrel**

Replace the entire contents of `packages/modules/src/track/infrastructure/index.ts` with:

```ts
export type { TrackRepoPort, Track } from "./track-repository.port.js";
export { makeTrackRepo } from "./track-repository.kysely.js";
```

- [ ] **Step 4: Create one file per use case under `app/`**

`packages/modules/src/track/app/list-tracks.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";

export async function listTracks(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { songId: string },
) {
  return deps.trackRepo.list(deps.db, { songId: input.songId });
}
```

`packages/modules/src/track/app/create-track.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";

export async function createTrack(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { songId: string; name: string; volume?: number },
) {
  const existing = await deps.trackRepo.list(deps.db, { songId: input.songId });
  const order = existing.length + 1;
  const volume = input.volume ?? 0;
  return deps.trackRepo.create(deps.db, {
    id: crypto.randomUUID(),
    songId: input.songId,
    name: input.name,
    volume,
    order,
  });
}
```

`packages/modules/src/track/app/update-track-volume.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";
import { conflict } from "@echo/errors";

export async function updateTrackVolume(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { trackId: string; volumeDb: number },
) {
  if (input.volumeDb < -60 || input.volumeDb > 6) {
    throw conflict("Volume must be between -60 dB and +6 dB");
  }
  return deps.trackRepo.updateVolume(deps.db, {
    trackId: input.trackId,
    volumeDb: input.volumeDb,
  });
}
```

`packages/modules/src/track/app/set-track-instrument-preset.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";
import { conflict } from "@echo/errors";

export async function setTrackInstrumentPreset(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { trackId: string; preset: number | null },
) {
  if (
    input.preset !== null &&
    (input.preset < 0 || input.preset > 127 || !Number.isInteger(input.preset))
  ) {
    throw conflict("Instrument preset must be an integer between 0 and 127");
  }
  return deps.trackRepo.setInstrumentPreset(deps.db, {
    trackId: input.trackId,
    preset: input.preset,
  });
}
```

`packages/modules/src/track/app/delete-track.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";

export async function deleteTrack(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { trackId: string },
) {
  return deps.trackRepo.delete(deps.db, { trackId: input.trackId });
}
```

`packages/modules/src/track/app/rename-track.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";

export async function renameTrack(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { trackId: string; name: string },
) {
  return deps.trackRepo.rename(deps.db, input);
}
```

`packages/modules/src/track/app/reorder-tracks.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";
import { notFound, conflict } from "@echo/errors";

export async function reorderTracks(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { songId: string; orderedTrackIds: string[] },
) {
  if (input.orderedTrackIds.length === 0) {
    return;
  }

  const uniqueIds = new Set(input.orderedTrackIds);
  if (uniqueIds.size !== input.orderedTrackIds.length) {
    throw conflict("orderedTrackIds contains duplicate track IDs");
  }

  const existingTracks = await deps.trackRepo.list(deps.db, { songId: input.songId });
  const existingIds = new Set(existingTracks.map((t) => t.id));

  for (const trackId of input.orderedTrackIds) {
    if (!existingIds.has(trackId)) {
      throw notFound(`Track ${trackId}`);
    }
  }

  if (input.orderedTrackIds.length !== existingTracks.length) {
    throw conflict("orderedTrackIds must include all tracks belonging to the song");
  }

  await deps.trackRepo.reorder(deps.db, { orderedTrackIds: input.orderedTrackIds });
}
```

- [ ] **Step 5: Create the `app/` barrel**

`packages/modules/src/track/app/index.ts`:

```ts
export { listTracks } from "./list-tracks.js";
export { createTrack } from "./create-track.js";
export { updateTrackVolume } from "./update-track-volume.js";
export { setTrackInstrumentPreset } from "./set-track-instrument-preset.js";
export { deleteTrack } from "./delete-track.js";
export { renameTrack } from "./rename-track.js";
export { reorderTracks } from "./reorder-tracks.js";
```

- [ ] **Step 6: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/track/use-cases
```

- [ ] **Step 7: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./track/use-cases": {
      "types": "./src/track/use-cases/index.ts",
      "default": "./src/track/use-cases/index.ts"
    },
```

with:

```json
    "./track/app": {
      "types": "./src/track/app/index.ts",
      "default": "./src/track/app/index.ts"
    },
```

- [ ] **Step 8: Update the track router**

Replace the entire contents of `apps/api/src/router/organizations/track.ts` with:

```ts
import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  listTracks,
  createTrack,
  updateTrackVolume,
  setTrackInstrumentPreset,
  deleteTrack,
  renameTrack,
  reorderTracks,
} from "@echo/modules/track/app";

export const makeTrackRouter = () =>
  router({
    list: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        return listTracks({ db: ctx.db, trackRepo: ctx.track }, { songId: input.songId });
      }),

    create: authedProcedure
      .input(
        z.object({
          songId: z.string().min(1),
          name: z.string().min(1, "Track name is required"),
          volume: z.number().min(-60).max(6).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return createTrack(
          { db: ctx.db, trackRepo: ctx.track },
          { songId: input.songId, name: input.name, volume: input.volume },
        );
      }),

    updateVolume: authedProcedure
      .input(
        z.object({
          trackId: z.string().min(1),
          volumeDb: z.number().min(-60).max(6),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return updateTrackVolume(
          { db: ctx.db, trackRepo: ctx.track },
          { trackId: input.trackId, volumeDb: input.volumeDb },
        );
      }),

    setInstrumentPreset: authedProcedure
      .input(
        z.object({
          trackId: z.string().min(1),
          preset: z.number().int().min(0).max(127).nullable(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return setTrackInstrumentPreset({ db: ctx.db, trackRepo: ctx.track }, input);
      }),

    delete: authedProcedure
      .input(z.object({ trackId: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return deleteTrack({ db: ctx.db, trackRepo: ctx.track }, { trackId: input.trackId });
      }),

    rename: authedProcedure
      .input(
        z.object({
          trackId: z.string().min(1),
          name: z.string().min(1, "Track name is required"),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return renameTrack({ db: ctx.db, trackRepo: ctx.track }, input);
      }),

    reorder: authedProcedure
      .input(
        z.object({
          songId: z.string().min(1),
          orderedTrackIds: z.array(z.string().min(1)),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return reorderTracks(
          { db: ctx.db, trackRepo: ctx.track },
          { songId: input.songId, orderedTrackIds: input.orderedTrackIds },
        );
      }),
  });
```

- [ ] **Step 9: Update `context.ts`**

In `apps/api/src/context.ts`, change:

```ts
      const track = makeTrackRepo({ db });
```

to:

```ts
      const track = makeTrackRepo();
```

- [ ] **Step 10: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add packages/modules/src/track packages/modules/package.json apps/api/src/router/organizations/track.ts apps/api/src/context.ts
git commit -m "refactor(track): split module into app/port/adapter files, thread db per call"
```

---

## Task 2: `organization` module

The organization repo never touches `db` (it wraps better-auth's API), so this task is a pure file split — no signature changes.

**Files:**
- Create: `packages/modules/src/organization/infrastructure/organization-repository.port.ts`
- Create: `packages/modules/src/organization/infrastructure/organization-repository.better-auth.ts`
- Modify: `packages/modules/src/organization/infrastructure/index.ts`
- Create: `packages/modules/src/organization/app/index.ts`
- Delete: `packages/modules/src/organization/use-cases/index.ts`
- Modify: `packages/modules/package.json`

**Interfaces:**
- Consumes: `Organization` domain type (unchanged).
- Produces: `OrganizationRepoPort`, `makeOrganizationRepo({ auth, headers })` (unchanged signature — this repo has no `db` dependency).

- [ ] **Step 1: Create the port file**

`packages/modules/src/organization/infrastructure/organization-repository.port.ts`:

```ts
import type { Organization } from "../domain/index.js";

export type { Organization };

export interface OrganizationRepoPort {
  get: (input: { slug: string }) => Promise<{ id: string; name: string } | null>;
}
```

- [ ] **Step 2: Create the adapter**

`packages/modules/src/organization/infrastructure/organization-repository.better-auth.ts`:

```ts
import type { ServerAuth } from "@echo/auth";
import type { OrganizationRepoPort } from "./organization-repository.port.js";

export const makeOrganizationRepo = ({
  auth,
  headers,
}: {
  auth: ServerAuth;
  headers: Headers;
}): OrganizationRepoPort => ({
  get: async ({ slug }) => {
    const org = await auth.api.getFullOrganization({
      headers,
      query: { organizationSlug: slug, membersLimit: 0 },
    });
    if (!org) return null;
    return { id: org.id, name: org.name };
  },
});
```

- [ ] **Step 3: Rewrite the infrastructure barrel**

Replace `packages/modules/src/organization/infrastructure/index.ts` with:

```ts
export type { OrganizationRepoPort, Organization } from "./organization-repository.port.js";
export { makeOrganizationRepo } from "./organization-repository.better-auth.js";
```

- [ ] **Step 4: Create the `app/` placeholder**

`packages/modules/src/organization/app/index.ts`:

```ts
// Organization use-cases are handled via better-auth APIs directly
export {};
```

- [ ] **Step 5: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/organization/use-cases
```

- [ ] **Step 6: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./organization/use-cases": {
      "types": "./src/organization/use-cases/index.ts",
      "default": "./src/organization/use-cases/index.ts"
    },
```

with:

```json
    "./organization/app": {
      "types": "./src/organization/app/index.ts",
      "default": "./src/organization/app/index.ts"
    },
```

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors (no router imports `organization/use-cases` today, so nothing else to update).

- [ ] **Step 8: Commit**

```bash
git add packages/modules/src/organization packages/modules/package.json
git commit -m "refactor(organization): split module into app/port/adapter files"
```

---

## Task 3: `song` module

`song` depends on `organization`'s `OrganizationRepoPort` (already available after Task 2, but the import target doesn't actually change either way).

**Files:**
- Create: `packages/modules/src/song/infrastructure/song-repository.port.ts`
- Create: `packages/modules/src/song/infrastructure/song-repository.kysely.ts`
- Modify: `packages/modules/src/song/infrastructure/index.ts`
- Create: `packages/modules/src/song/app/create-song.ts`
- Create: `packages/modules/src/song/app/get-song.ts`
- Create: `packages/modules/src/song/app/list-songs.ts`
- Create: `packages/modules/src/song/app/update-song.ts`
- Create: `packages/modules/src/song/app/index.ts`
- Delete: `packages/modules/src/song/use-cases/index.ts`
- Modify: `packages/modules/package.json`
- Modify: `apps/api/src/router/organizations/song.ts`
- Modify: `apps/api/src/context.ts`

**Interfaces:**
- Consumes: `Song` domain type (unchanged), `OrganizationRepoPort` from `packages/modules/src/organization/infrastructure/index.ts` (its `get` method has no `db` param).
- Produces: `SongRepoPort` (methods take `db: KyselyDB` first), `makeSongRepo()`, and `createSong`, `getSong`, `listSongs`, `updateSong` async functions `(deps, input)`.

- [ ] **Step 1: Create the port file**

`packages/modules/src/song/infrastructure/song-repository.port.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { Song } from "../domain/index.js";

export type { Song };

export interface SongRepoPort {
  list: (db: KyselyDB, input: { organizationId: string }) => Promise<Song[]>;
  create: (
    db: KyselyDB,
    input: {
      id: string;
      name: string;
      organizationId: string;
      createdBy: string;
      key?: string | null;
    },
  ) => Promise<Song>;
  get: (db: KyselyDB, input: { songId: string }) => Promise<Song | null>;
  update: (
    db: KyselyDB,
    input: { songId: string; bpm?: number; key?: string | null },
  ) => Promise<Song>;
}
```

- [ ] **Step 2: Create the Kysely adapter**

`packages/modules/src/song/infrastructure/song-repository.kysely.ts`:

```ts
import type { Song } from "../domain/index.js";
import type { SongRepoPort } from "./song-repository.port.js";

export const makeSongRepo = (): SongRepoPort => ({
  list: async (db, { organizationId }) => {
    const rows = await db
      .selectFrom("song")
      .selectAll()
      .where("organizationId", "=", organizationId)
      .execute();
    return rows.map(toSong);
  },

  create: async (db, { id, name, organizationId, createdBy, key }) => {
    const row = await db
      .insertInto("song")
      .values({ id, name, organizationId, createdBy, key: key ?? null })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toSong(row);
  },

  get: async (db, { songId }) => {
    const row = await db
      .selectFrom("song")
      .selectAll()
      .where("id", "=", songId)
      .executeTakeFirst();
    return row ? toSong(row) : null;
  },

  update: async (db, { songId, bpm, key }) => {
    const row = await db
      .updateTable("song")
      .set({
        ...(bpm !== undefined ? { bpm } : {}),
        ...(key !== undefined ? { key } : {}),
        updatedAt: new Date(),
      })
      .where("id", "=", songId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toSong(row);
  },
});

function toSong(row: {
  id: string;
  name: string;
  organizationId: string;
  bpm: number | null;
  description: string | null;
  key: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}): Song {
  return {
    id: row.id,
    name: row.name,
    organizationId: row.organizationId,
    bpm: row.bpm,
    description: row.description,
    key: row.key,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}
```

- [ ] **Step 3: Rewrite the infrastructure barrel**

Replace `packages/modules/src/song/infrastructure/index.ts` with:

```ts
export type { SongRepoPort, Song } from "./song-repository.port.js";
export { makeSongRepo } from "./song-repository.kysely.js";
```

- [ ] **Step 4: Create the `app/` files**

`packages/modules/src/song/app/create-song.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongRepoPort } from "../infrastructure/index.js";
import type { OrganizationRepoPort } from "../../organization/infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function createSong(
  deps: { db: KyselyDB; songRepo: SongRepoPort; organizationRepo: OrganizationRepoPort },
  input: { organizationSlug: string; name: string; createdBy: string; key?: string | null },
) {
  const org = await deps.organizationRepo.get({ slug: input.organizationSlug });
  if (!org) throw notFound("Organization");
  return deps.songRepo.create(deps.db, {
    id: crypto.randomUUID(),
    name: input.name,
    organizationId: org.id,
    createdBy: input.createdBy,
    key: input.key,
  });
}
```

`packages/modules/src/song/app/get-song.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function getSong(
  deps: { db: KyselyDB; songRepo: SongRepoPort },
  input: { songId: string },
) {
  const song = await deps.songRepo.get(deps.db, { songId: input.songId });
  if (!song) throw notFound("Song");
  return song;
}
```

`packages/modules/src/song/app/list-songs.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongRepoPort } from "../infrastructure/index.js";
import type { OrganizationRepoPort } from "../../organization/infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function listSongs(
  deps: { db: KyselyDB; songRepo: SongRepoPort; organizationRepo: OrganizationRepoPort },
  input: { organizationSlug: string },
) {
  const org = await deps.organizationRepo.get({ slug: input.organizationSlug });
  if (!org) throw notFound("Organization");
  return deps.songRepo.list(deps.db, { organizationId: org.id });
}
```

`packages/modules/src/song/app/update-song.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function updateSong(
  deps: { db: KyselyDB; songRepo: SongRepoPort },
  input: { songId: string; bpm?: number; key?: string | null },
) {
  const song = await deps.songRepo.get(deps.db, { songId: input.songId });
  if (!song) throw notFound("Song");
  return deps.songRepo.update(deps.db, input);
}
```

- [ ] **Step 5: Create the `app/` barrel**

`packages/modules/src/song/app/index.ts`:

```ts
export { createSong } from "./create-song.js";
export { getSong } from "./get-song.js";
export { listSongs } from "./list-songs.js";
export { updateSong } from "./update-song.js";
```

- [ ] **Step 6: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/song/use-cases
```

- [ ] **Step 7: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./song/use-cases": {
      "types": "./src/song/use-cases/index.ts",
      "default": "./src/song/use-cases/index.ts"
    },
```

with:

```json
    "./song/app": {
      "types": "./src/song/app/index.ts",
      "default": "./src/song/app/index.ts"
    },
```

- [ ] **Step 8: Update the song router**

Replace the top of `apps/api/src/router/organizations/song.ts` (imports and the four procedure bodies) — full file becomes:

```ts
import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import { listSongs, createSong, getSong, updateSong } from "@echo/modules/song/app";
import { appErrorToTRPC } from "../../lib/errors";
import { makeSongSectionRouter } from "./song-section";

export const makeSongRouter = () =>
  router({
    section: makeSongSectionRouter(),
    list: authedProcedure
      .input(z.object({ organizationSlug: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        try {
          return await listSongs(
            { db: ctx.db, songRepo: ctx.song, organizationRepo: ctx.organization },
            { organizationSlug: input.organizationSlug },
          );
        } catch (e) {
          throw appErrorToTRPC(e);
        }
      }),

    create: authedProcedure
      .input(
        z.object({
          organizationSlug: z.string().min(1),
          name: z.string().min(1, "Name is required"),
          key: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        try {
          return await createSong(
            { db: ctx.db, songRepo: ctx.song, organizationRepo: ctx.organization },
            {
              organizationSlug: input.organizationSlug,
              name: input.name,
              createdBy: ctx.session.user.id,
              key: input.key,
            },
          );
        } catch (e) {
          throw appErrorToTRPC(e);
        }
      }),

    get: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        try {
          return await getSong({ db: ctx.db, songRepo: ctx.song }, { songId: input.songId });
        } catch (e) {
          throw appErrorToTRPC(e);
        }
      }),

    update: authedProcedure
      .input(
        z.object({
          songId: z.string().min(1),
          bpm: z.number().int().positive().optional(),
          key: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        try {
          return await updateSong({ db: ctx.db, songRepo: ctx.song }, input);
        } catch (e) {
          throw appErrorToTRPC(e);
        }
      }),
  });
```

- [ ] **Step 9: Update `context.ts`**

Change:

```ts
      const song = makeSongRepo({ db });
```

to:

```ts
      const song = makeSongRepo();
```

- [ ] **Step 10: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add packages/modules/src/song packages/modules/package.json apps/api/src/router/organizations/song.ts apps/api/src/context.ts
git commit -m "refactor(song): split module into app/port/adapter files, thread db per call"
```

---

## Task 4: `song-section` module (two repos: definition + instance)

**Files:**
- Create: `packages/modules/src/song-section/domain/utils.ts`
- Create: `packages/modules/src/song-section/infrastructure/song-section-definition-repository.port.ts`
- Create: `packages/modules/src/song-section/infrastructure/song-section-definition-repository.kysely.ts`
- Create: `packages/modules/src/song-section/infrastructure/song-section-instance-repository.port.ts`
- Create: `packages/modules/src/song-section/infrastructure/song-section-instance-repository.kysely.ts`
- Modify: `packages/modules/src/song-section/infrastructure/index.ts`
- Create: `packages/modules/src/song-section/app/create-section-definition.ts`
- Create: `packages/modules/src/song-section/app/update-section-definition.ts`
- Create: `packages/modules/src/song-section/app/delete-section-definition.ts`
- Create: `packages/modules/src/song-section/app/list-section-definitions.ts`
- Create: `packages/modules/src/song-section/app/create-section-instance.ts`
- Create: `packages/modules/src/song-section/app/update-section-instance.ts`
- Create: `packages/modules/src/song-section/app/delete-section-instance.ts`
- Create: `packages/modules/src/song-section/app/list-section-instances.ts`
- Create: `packages/modules/src/song-section/app/reorder-section-instances.ts`
- Create: `packages/modules/src/song-section/app/index.ts`
- Delete: `packages/modules/src/song-section/use-cases/index.ts`
- Modify: `packages/modules/package.json`
- Modify: `apps/api/src/router/organizations/song-section.ts`
- Modify: `apps/api/src/context.ts`

**Interfaces:**
- Consumes: `SongSectionDefinition`, `SongSectionInstance`, `SongSectionInstanceWithDefinition`, `SongChord` domain types (unchanged).
- Produces: `SongSectionDefinitionRepoPort`, `SongSectionInstanceRepoPort` (methods take `db: KyselyDB` first), `makeSongSectionDefinitionRepo()`, `makeSongSectionInstanceRepo()`, and 9 exported async functions.

- [ ] **Step 1: Extract the shared `parseChords` helper into `domain/utils.ts`**

Both the definition and instance adapters need to parse the same persisted JSON column, so this pure helper is shared via `domain/utils.ts` (erp's convention for module-local pure helpers) instead of being duplicated.

`packages/modules/src/song-section/domain/utils.ts`:

```ts
import type { SongChord } from "./index.js";

export function parseChords(raw: unknown): SongChord[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw as SongChord[];
  return [];
}
```

- [ ] **Step 2: Create the definition port file**

`packages/modules/src/song-section/infrastructure/song-section-definition-repository.port.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongSectionDefinition, SongChord } from "../domain/index.js";

export type { SongSectionDefinition, SongChord };

export interface SongSectionDefinitionRepoPort {
  create: (
    db: KyselyDB,
    input: {
      id: string;
      songId: string;
      name: string;
      chords: SongChord[];
      lyrics?: string | null;
      color?: string | null;
      repeat?: number;
    },
  ) => Promise<SongSectionDefinition>;
  update: (
    db: KyselyDB,
    input: {
      id: string;
      name?: string;
      chords?: SongChord[];
      lyrics?: string | null;
      color?: string | null;
      repeat?: number;
    },
  ) => Promise<SongSectionDefinition>;
  delete: (db: KyselyDB, input: { id: string }) => Promise<void>;
  list: (db: KyselyDB, input: { songId: string }) => Promise<SongSectionDefinition[]>;
  get: (db: KyselyDB, input: { id: string }) => Promise<SongSectionDefinition | null>;
}
```

- [ ] **Step 3: Create the definition Kysely adapter**

`packages/modules/src/song-section/infrastructure/song-section-definition-repository.kysely.ts`:

```ts
import type { SongSectionDefinition } from "../domain/index.js";
import { parseChords } from "../domain/utils.js";
import type { SongSectionDefinitionRepoPort } from "./song-section-definition-repository.port.js";

export const makeSongSectionDefinitionRepo = (): SongSectionDefinitionRepoPort => ({
  create: async (db, { id, songId, name, chords, lyrics, color }) => {
    const row = await db
      .insertInto("songSectionDefinition")
      .values({
        id,
        songId,
        name,
        chords: JSON.stringify(chords ?? []) as any,
        lyrics: lyrics ?? null,
        color: color ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toDefinition(row);
  },

  update: async (db, { id, name, chords, lyrics, color }) => {
    const row = await db
      .updateTable("songSectionDefinition")
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(chords !== undefined ? { chords: JSON.stringify(chords) as any } : {}),
        ...(lyrics !== undefined ? { lyrics } : {}),
        ...(color !== undefined ? { color } : {}),
        updatedAt: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toDefinition(row);
  },

  delete: async (db, { id }) => {
    await db.deleteFrom("songSectionDefinition").where("id", "=", id).execute();
  },

  list: async (db, { songId }) => {
    const rows = await db
      .selectFrom("songSectionDefinition")
      .selectAll()
      .where("songId", "=", songId)
      .orderBy("name", "asc")
      .execute();
    return rows.map(toDefinition);
  },

  get: async (db, { id }) => {
    const row = await db
      .selectFrom("songSectionDefinition")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toDefinition(row) : null;
  },
});

function toDefinition(row: {
  id: string;
  songId: string;
  name: string;
  chords: unknown;
  lyrics: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  repeat: number;
}): SongSectionDefinition {
  return {
    id: row.id,
    songId: row.songId,
    name: row.name,
    chords: parseChords(row.chords),
    lyrics: row.lyrics,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    repeat: row.repeat,
  };
}
```

- [ ] **Step 4: Create the instance port file**

`packages/modules/src/song-section/infrastructure/song-section-instance-repository.port.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongSectionInstance, SongSectionInstanceWithDefinition } from "../domain/index.js";

export type { SongSectionInstance, SongSectionInstanceWithDefinition };

export interface SongSectionInstanceRepoPort {
  create: (
    db: KyselyDB,
    input: {
      id: string;
      songId: string;
      definitionId: string;
      startMeasure: number;
      lengthMeasures: number;
      lyricsOverride?: string | null;
    },
  ) => Promise<SongSectionInstance>;
  update: (
    db: KyselyDB,
    input: {
      id: string;
      startMeasure?: number;
      lengthMeasures?: number;
      lyricsOverride?: string | null;
      repeat?: number;
    },
  ) => Promise<SongSectionInstance>;
  delete: (db: KyselyDB, input: { id: string }) => Promise<void>;
  list: (db: KyselyDB, input: { songId: string }) => Promise<SongSectionInstanceWithDefinition[]>;
  get: (db: KyselyDB, input: { id: string }) => Promise<SongSectionInstance | null>;
  getLastStartMeasure: (
    db: KyselyDB,
    input: { songId: string },
  ) => Promise<{ startMeasure: number; lengthMeasures: number } | null>;
  updateStartMeasures: (
    db: KyselyDB,
    input: { updates: Array<{ id: string; startMeasure: number }> },
  ) => Promise<void>;
}
```

- [ ] **Step 5: Create the instance Kysely adapter**

`packages/modules/src/song-section/infrastructure/song-section-instance-repository.kysely.ts`:

```ts
import type { SongSectionInstance } from "../domain/index.js";
import { parseChords } from "../domain/utils.js";
import type { SongSectionInstanceRepoPort } from "./song-section-instance-repository.port.js";

export const makeSongSectionInstanceRepo = (): SongSectionInstanceRepoPort => ({
  create: async (db, { id, songId, definitionId, startMeasure, lengthMeasures, lyricsOverride }) => {
    const row = await db
      .insertInto("songSectionInstance")
      .values({
        id,
        songId,
        definitionId,
        startMeasure,
        lengthMeasures,
        lyricsOverride: lyricsOverride ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toInstance(row);
  },

  update: async (db, { id, startMeasure, lengthMeasures, lyricsOverride, repeat }) => {
    const row = await db
      .updateTable("songSectionInstance")
      .set({
        ...(startMeasure !== undefined ? { startMeasure } : {}),
        ...(lengthMeasures !== undefined ? { lengthMeasures } : {}),
        ...(lyricsOverride !== undefined ? { lyricsOverride } : {}),
        ...(repeat !== undefined ? { repeat } : {}),
        updatedAt: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toInstance(row);
  },

  delete: async (db, { id }) => {
    await db.deleteFrom("songSectionInstance").where("id", "=", id).execute();
  },

  list: async (db, { songId }) => {
    const rows = await db
      .selectFrom("songSectionInstance as i")
      .innerJoin("songSectionDefinition as d", "d.id", "i.definitionId")
      .select([
        "i.id",
        "i.songId",
        "i.definitionId",
        "i.startMeasure",
        "i.lengthMeasures",
        "i.lyricsOverride",
        "i.createdAt",
        "i.updatedAt",
        "i.repeat",
        "d.id as defId",
        "d.songId as defSongId",
        "d.name as defName",
        "d.chords as defChords",
        "d.lyrics as defLyrics",
        "d.color as defColor",
        "d.createdAt as defCreatedAt",
        "d.updatedAt as defUpdatedAt",
        "d.repeat as defRepeat",
      ])
      .where("i.songId", "=", songId)
      .orderBy("i.startMeasure", "asc")
      .execute();

    return rows.map((row) => ({
      id: row.id,
      songId: row.songId,
      definitionId: row.definitionId,
      startMeasure: row.startMeasure,
      lengthMeasures: row.lengthMeasures,
      lyricsOverride: row.lyricsOverride,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      repeat: row.repeat,
      definition: {
        id: row.defId,
        songId: row.defSongId,
        name: row.defName,
        chords: parseChords(row.defChords),
        lyrics: row.defLyrics,
        color: row.defColor,
        createdAt: row.defCreatedAt,
        updatedAt: row.defUpdatedAt,
        repeat: row.defRepeat,
      },
    }));
  },

  get: async (db, { id }) => {
    const row = await db
      .selectFrom("songSectionInstance")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toInstance(row) : null;
  },

  getLastStartMeasure: async (db, { songId }) => {
    const row = await db
      .selectFrom("songSectionInstance")
      .select(["startMeasure", "lengthMeasures"])
      .where("songId", "=", songId)
      .orderBy("startMeasure", "desc")
      .limit(1)
      .executeTakeFirst();
    return row ? { startMeasure: row.startMeasure, lengthMeasures: row.lengthMeasures } : null;
  },

  updateStartMeasures: async (db, { updates }) => {
    for (const { id, startMeasure } of updates) {
      await db
        .updateTable("songSectionInstance")
        .set({ startMeasure, updatedAt: new Date() })
        .where("id", "=", id)
        .execute();
    }
  },
});

function toInstance(row: {
  id: string;
  songId: string;
  definitionId: string;
  startMeasure: number;
  lengthMeasures: number;
  lyricsOverride: string | null;
  createdAt: Date;
  updatedAt: Date;
  repeat: number;
}): SongSectionInstance {
  return {
    id: row.id,
    songId: row.songId,
    definitionId: row.definitionId,
    startMeasure: row.startMeasure,
    lengthMeasures: row.lengthMeasures,
    lyricsOverride: row.lyricsOverride,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    repeat: row.repeat,
  };
}
```

- [ ] **Step 6: Rewrite the infrastructure barrel**

Replace `packages/modules/src/song-section/infrastructure/index.ts` with:

```ts
export type {
  SongSectionDefinitionRepoPort,
  SongSectionDefinition,
  SongChord,
} from "./song-section-definition-repository.port.js";
export { makeSongSectionDefinitionRepo } from "./song-section-definition-repository.kysely.js";

export type {
  SongSectionInstanceRepoPort,
  SongSectionInstance,
  SongSectionInstanceWithDefinition,
} from "./song-section-instance-repository.port.js";
export { makeSongSectionInstanceRepo } from "./song-section-instance-repository.kysely.js";
```

- [ ] **Step 7: Create the `app/` files**

`packages/modules/src/song-section/app/create-section-definition.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongSectionDefinitionRepoPort, SongChord } from "../infrastructure/index.js";

export async function createSectionDefinition(
  deps: { db: KyselyDB; definitionRepo: SongSectionDefinitionRepoPort },
  input: {
    songId: string;
    name: string;
    chords?: SongChord[];
    lyrics?: string | null;
    color?: string | null;
  },
) {
  return deps.definitionRepo.create(deps.db, {
    id: crypto.randomUUID(),
    songId: input.songId,
    name: input.name,
    chords: input.chords ?? [],
    lyrics: input.lyrics ?? null,
    color: input.color ?? null,
  });
}
```

`packages/modules/src/song-section/app/update-section-definition.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongSectionDefinitionRepoPort, SongChord } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function updateSectionDefinition(
  deps: { db: KyselyDB; definitionRepo: SongSectionDefinitionRepoPort },
  input: {
    id: string;
    name?: string;
    chords?: SongChord[];
    lyrics?: string | null;
    color?: string | null;
  },
) {
  const existing = await deps.definitionRepo.get(deps.db, { id: input.id });
  if (!existing) throw notFound("SongSectionDefinition");
  return deps.definitionRepo.update(deps.db, input);
}
```

`packages/modules/src/song-section/app/delete-section-definition.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongSectionDefinitionRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function deleteSectionDefinition(
  deps: { db: KyselyDB; definitionRepo: SongSectionDefinitionRepoPort },
  input: { id: string },
) {
  const existing = await deps.definitionRepo.get(deps.db, { id: input.id });
  if (!existing) throw notFound("SongSectionDefinition");
  await deps.definitionRepo.delete(deps.db, { id: input.id });
}
```

`packages/modules/src/song-section/app/list-section-definitions.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongSectionDefinitionRepoPort } from "../infrastructure/index.js";

export async function listSectionDefinitions(
  deps: { db: KyselyDB; definitionRepo: SongSectionDefinitionRepoPort },
  input: { songId: string },
) {
  return deps.definitionRepo.list(deps.db, { songId: input.songId });
}
```

`packages/modules/src/song-section/app/create-section-instance.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type {
  SongSectionInstanceRepoPort,
  SongSectionDefinitionRepoPort,
} from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function createSectionInstance(
  deps: {
    db: KyselyDB;
    instanceRepo: SongSectionInstanceRepoPort;
    definitionRepo: SongSectionDefinitionRepoPort;
  },
  input: {
    songId: string;
    definitionId: string;
    lyricsOverride?: string | null;
    lengthMeasures?: number;
  },
) {
  const definition = await deps.definitionRepo.get(deps.db, { id: input.definitionId });
  if (!definition) throw notFound("SongSectionDefinition");

  const lengthMeasures = input.lengthMeasures ?? 8;
  const last = await deps.instanceRepo.getLastStartMeasure(deps.db, { songId: input.songId });
  const startMeasure = last ? last.startMeasure + last.lengthMeasures : 1;

  return deps.instanceRepo.create(deps.db, {
    id: crypto.randomUUID(),
    songId: input.songId,
    definitionId: input.definitionId,
    startMeasure,
    lengthMeasures,
    lyricsOverride: input.lyricsOverride ?? null,
  });
}
```

`packages/modules/src/song-section/app/update-section-instance.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongSectionInstanceRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function updateSectionInstance(
  deps: { db: KyselyDB; instanceRepo: SongSectionInstanceRepoPort },
  input: {
    id: string;
    startMeasure?: number;
    lengthMeasures?: number;
    lyricsOverride?: string | null;
  },
) {
  const existing = await deps.instanceRepo.get(deps.db, { id: input.id });
  if (!existing) throw notFound("SongSectionInstance");
  return deps.instanceRepo.update(deps.db, input);
}
```

`packages/modules/src/song-section/app/delete-section-instance.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongSectionInstanceRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function deleteSectionInstance(
  deps: { db: KyselyDB; instanceRepo: SongSectionInstanceRepoPort },
  input: { id: string },
) {
  const existing = await deps.instanceRepo.get(deps.db, { id: input.id });
  if (!existing) throw notFound("SongSectionInstance");
  await deps.instanceRepo.delete(deps.db, { id: input.id });
}
```

`packages/modules/src/song-section/app/list-section-instances.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongSectionInstanceRepoPort } from "../infrastructure/index.js";

export async function listSectionInstances(
  deps: { db: KyselyDB; instanceRepo: SongSectionInstanceRepoPort },
  input: { songId: string },
) {
  return deps.instanceRepo.list(deps.db, { songId: input.songId });
}
```

`packages/modules/src/song-section/app/reorder-section-instances.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { SongSectionInstanceRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function reorderSectionInstances(
  deps: { db: KyselyDB; instanceRepo: SongSectionInstanceRepoPort },
  input: { songId: string; orderedIds: string[] },
) {
  const instances = await deps.instanceRepo.list(deps.db, { songId: input.songId });
  const instanceMap = new Map(instances.map((i) => [i.id, i]));

  const updates = input.orderedIds.map((id, index) => {
    const instance = instanceMap.get(id);
    if (!instance) throw notFound("SongSectionInstance");
    const startMeasure = 1 + index * instance.lengthMeasures;
    return { id, startMeasure };
  });

  await deps.instanceRepo.updateStartMeasures(deps.db, { updates });
  return deps.instanceRepo.list(deps.db, { songId: input.songId });
}
```

- [ ] **Step 8: Create the `app/` barrel**

`packages/modules/src/song-section/app/index.ts`:

```ts
export { createSectionDefinition } from "./create-section-definition.js";
export { updateSectionDefinition } from "./update-section-definition.js";
export { deleteSectionDefinition } from "./delete-section-definition.js";
export { listSectionDefinitions } from "./list-section-definitions.js";
export { createSectionInstance } from "./create-section-instance.js";
export { updateSectionInstance } from "./update-section-instance.js";
export { deleteSectionInstance } from "./delete-section-instance.js";
export { listSectionInstances } from "./list-section-instances.js";
export { reorderSectionInstances } from "./reorder-section-instances.js";
```

- [ ] **Step 9: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/song-section/use-cases
```

- [ ] **Step 10: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./song-section/use-cases": {
      "types": "./src/song-section/use-cases/index.ts",
      "default": "./src/song-section/use-cases/index.ts"
    }
```

with:

```json
    "./song-section/app": {
      "types": "./src/song-section/app/index.ts",
      "default": "./src/song-section/app/index.ts"
    }
```

- [ ] **Step 11: Update the song-section router**

Replace the entire contents of `apps/api/src/router/organizations/song-section.ts` with:

```ts
import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  createSectionDefinition,
  updateSectionDefinition,
  deleteSectionDefinition,
  listSectionDefinitions,
  createSectionInstance,
  updateSectionInstance,
  deleteSectionInstance,
  listSectionInstances,
  reorderSectionInstances,
} from "@echo/modules/song-section/app";

const chordSchema = z.object({
  at: z.number().min(0.5),
  chord: z.string().min(1),
});

export const makeSongSectionRouter = () =>
  router({
    definition: router({
      create: authedProcedure
        .input(
          z.object({
            songId: z.string().min(1),
            name: z.string().min(1, "Name is required"),
            chords: z.array(chordSchema).optional(),
            lyrics: z.string().nullable().optional(),
            color: z.string().nullable().optional(),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return createSectionDefinition(
            { db: ctx.db, definitionRepo: ctx.songSectionDefinition },
            input,
          );
        }),

      update: authedProcedure
        .input(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1).optional(),
            chords: z.array(chordSchema).optional(),
            lyrics: z.string().nullable().optional(),
            color: z.string().nullable().optional(),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return updateSectionDefinition(
            { db: ctx.db, definitionRepo: ctx.songSectionDefinition },
            input,
          );
        }),

      delete: authedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
          await deleteSectionDefinition(
            { db: ctx.db, definitionRepo: ctx.songSectionDefinition },
            input,
          );
        }),

      list: authedProcedure
        .input(z.object({ songId: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
          return listSectionDefinitions(
            { db: ctx.db, definitionRepo: ctx.songSectionDefinition },
            input,
          );
        }),
    }),

    instance: router({
      create: authedProcedure
        .input(
          z.object({
            songId: z.string().min(1),
            definitionId: z.string().min(1),
            lyricsOverride: z.string().nullable().optional(),
            lengthMeasures: z.number().positive().optional(),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return createSectionInstance(
            {
              db: ctx.db,
              instanceRepo: ctx.songSectionInstance,
              definitionRepo: ctx.songSectionDefinition,
            },
            input,
          );
        }),

      update: authedProcedure
        .input(
          z.object({
            id: z.string().min(1),
            startMeasure: z.number().min(1).optional(),
            lengthMeasures: z.number().positive().optional(),
            lyricsOverride: z.string().nullable().optional(),
            repeat: z.number().optional(),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return updateSectionInstance(
            { db: ctx.db, instanceRepo: ctx.songSectionInstance },
            input,
          );
        }),

      delete: authedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
          await deleteSectionInstance(
            { db: ctx.db, instanceRepo: ctx.songSectionInstance },
            input,
          );
        }),

      list: authedProcedure
        .input(z.object({ songId: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
          return listSectionInstances(
            { db: ctx.db, instanceRepo: ctx.songSectionInstance },
            input,
          );
        }),

      reorder: authedProcedure
        .input(
          z.object({
            songId: z.string().min(1),
            orderedIds: z.array(z.string().min(1)).min(1),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return reorderSectionInstances(
            { db: ctx.db, instanceRepo: ctx.songSectionInstance },
            input,
          );
        }),
    }),
  });
```

- [ ] **Step 12: Update `context.ts`**

Change:

```ts
      const songSectionDefinition = makeSongSectionDefinitionRepo({ db });
      const songSectionInstance = makeSongSectionInstanceRepo({ db });
```

to:

```ts
      const songSectionDefinition = makeSongSectionDefinitionRepo();
      const songSectionInstance = makeSongSectionInstanceRepo();
```

- [ ] **Step 13: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 14: Commit**

```bash
git add packages/modules/src/song-section packages/modules/package.json apps/api/src/router/organizations/song-section.ts apps/api/src/context.ts
git commit -m "refactor(song-section): split module into app/port/adapter files, thread db per call"
```

---

## Task 5: `file` module

This module has two unrelated concerns — a db-backed `FileRepoPort` and an S3-backed `FileStoragePort` — split into two port/adapter pairs.

**Files:**
- Create: `packages/modules/src/file/infrastructure/file-repository.port.ts`
- Create: `packages/modules/src/file/infrastructure/file-repository.kysely.ts`
- Create: `packages/modules/src/file/infrastructure/file-storage.port.ts`
- Create: `packages/modules/src/file/infrastructure/file-storage.s3.ts`
- Modify: `packages/modules/src/file/infrastructure/index.ts`
- Create: `packages/modules/src/file/app/index.ts`
- Delete: `packages/modules/src/file/use-cases/index.ts`
- Modify: `packages/modules/package.json`
- Modify: `apps/api/src/context.ts`

**Interfaces:**
- Consumes: `AudioFile`, `FileType` domain types (unchanged).
- Produces: `FileRepoPort` (`create` takes `db: KyselyDB` first), `makeFileRepo()`; `FileStoragePort` (unchanged, no `db`), `makeFileStorageAdapter(config)` (unchanged).

- [ ] **Step 1: Create the file-repository port**

`packages/modules/src/file/infrastructure/file-repository.port.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { AudioFile, FileType } from "../domain/index.js";

export type { AudioFile, FileType };

export interface FileRepoPort {
  create: (
    db: KyselyDB,
    input: { id: string; storageKey: string; filename: string; type: FileType; organizationId: string },
  ) => Promise<AudioFile>;
}
```

- [ ] **Step 2: Create the file-repository Kysely adapter**

`packages/modules/src/file/infrastructure/file-repository.kysely.ts`:

```ts
import type { AudioFile, FileType } from "../domain/index.js";
import type { FileRepoPort } from "./file-repository.port.js";

export const makeFileRepo = (): FileRepoPort => ({
  create: async (db, { id, storageKey, filename, type, organizationId }) => {
    const row = await db
      .insertInto("file")
      .values({ id, storageKey, filename, type, organizationId })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toFile(row);
  },
});

function toFile(row: {
  id: string;
  storageKey: string;
  filename: string;
  type: string;
  organizationId: string;
  createdAt: Date;
}): AudioFile {
  return {
    id: row.id,
    storageKey: row.storageKey,
    filename: row.filename,
    type: row.type as FileType,
    organizationId: row.organizationId,
    createdAt: row.createdAt,
  };
}
```

- [ ] **Step 3: Create the file-storage port**

`packages/modules/src/file/infrastructure/file-storage.port.ts`:

```ts
export interface FileStoragePort {
  getUploadUrl: (input: { key: string; contentType: string }) => Promise<string>;
  getDownloadUrl: (input: { key: string }) => Promise<string>;
  deleteFile: (input: { key: string }) => Promise<void>;
}

export type S3Config = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
};
```

- [ ] **Step 4: Create the S3 adapter**

`packages/modules/src/file/infrastructure/file-storage.s3.ts`:

```ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { FileStoragePort, S3Config } from "./file-storage.port.js";

export const makeFileStorageAdapter = (config: S3Config): FileStoragePort => {
  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
  });

  return {
    getUploadUrl: async ({ key, contentType }) => {
      return getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: 300 },
      );
    },

    getDownloadUrl: async ({ key }) => {
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        { expiresIn: 3600 },
      );
    },

    deleteFile: async ({ key }) => {
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    },
  };
};
```

- [ ] **Step 5: Rewrite the infrastructure barrel**

Replace `packages/modules/src/file/infrastructure/index.ts` with:

```ts
export type { FileRepoPort, AudioFile, FileType } from "./file-repository.port.js";
export { makeFileRepo } from "./file-repository.kysely.js";

export type { FileStoragePort, S3Config } from "./file-storage.port.js";
export { makeFileStorageAdapter } from "./file-storage.s3.js";
```

- [ ] **Step 6: Create the `app/` placeholder**

`packages/modules/src/file/app/index.ts`:

```ts
// File use-cases live in audio-clip and midi-clip modules
export {};
```

- [ ] **Step 7: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/file/use-cases
```

- [ ] **Step 8: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./file/use-cases": {
      "types": "./src/file/use-cases/index.ts",
      "default": "./src/file/use-cases/index.ts"
    },
```

with:

```json
    "./file/app": {
      "types": "./src/file/app/index.ts",
      "default": "./src/file/app/index.ts"
    },
```

- [ ] **Step 9: Update `context.ts`**

Change:

```ts
      const file = makeFileRepo({ db });
```

to:

```ts
      const file = makeFileRepo();
```

(`makeFileStorageAdapter(appConfig.s3)` at the top-level singleton section stays exactly as-is — it never depended on `db`.)

- [ ] **Step 10: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add packages/modules/src/file packages/modules/package.json apps/api/src/context.ts
git commit -m "refactor(file): split module into port/adapter files, thread db per call for file-repository"
```

---

## Task 6: `audio-clip` module

**Files:**
- Create: `packages/modules/src/audio-clip/infrastructure/audio-clip-repository.port.ts`
- Create: `packages/modules/src/audio-clip/infrastructure/audio-clip-repository.kysely.ts`
- Modify: `packages/modules/src/audio-clip/infrastructure/index.ts`
- Create: `packages/modules/src/audio-clip/app/list-audio-clips.ts`
- Create: `packages/modules/src/audio-clip/app/get-upload-url.ts`
- Create: `packages/modules/src/audio-clip/app/register-audio-clip.ts`
- Create: `packages/modules/src/audio-clip/app/update-audio-clip-position.ts`
- Create: `packages/modules/src/audio-clip/app/delete-audio-clip.ts`
- Create: `packages/modules/src/audio-clip/app/delete-many-audio-clips.ts`
- Create: `packages/modules/src/audio-clip/app/get-signed-urls.ts`
- Create: `packages/modules/src/audio-clip/app/rename-audio-clip.ts`
- Create: `packages/modules/src/audio-clip/app/index.ts`
- Delete: `packages/modules/src/audio-clip/use-cases/index.ts`
- Modify: `packages/modules/package.json`
- Modify: `apps/api/src/router/organizations/audio-clip.ts`
- Modify: `apps/api/src/context.ts`

**Interfaces:**
- Consumes: `AudioClip` domain type (unchanged), `FileType` from `file/domain`, `TrackRepoPort` from `track/infrastructure` (Task 1), `FileRepoPort`/`FileStoragePort` from `file/infrastructure` (Task 5).
- Produces: `AudioClipRepoPort` (methods take `db: KyselyDB` first, except none are db-less here), `makeAudioClipRepo()`, and 8 exported async functions.

- [ ] **Step 1: Create the port file**

`packages/modules/src/audio-clip/infrastructure/audio-clip-repository.port.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { AudioClip } from "../domain/index.js";

export type { AudioClip };

export interface AudioClipRepoPort {
  list: (db: KyselyDB, input: { trackId: string }) => Promise<AudioClip[]>;
  listBySong: (db: KyselyDB, input: { songId: string }) => Promise<AudioClip[]>;
  findById: (db: KyselyDB, input: { clipId: string }) => Promise<AudioClip | null>;
  create: (
    db: KyselyDB,
    input: {
      id: string;
      trackId: string;
      fileId: string;
      durationMs?: number | null;
      startMeasure: number;
    },
  ) => Promise<AudioClip>;
  updatePosition: (
    db: KyselyDB,
    input: { clipId: string; startMeasure: number; trackId?: string },
  ) => Promise<AudioClip>;
  delete: (db: KyselyDB, input: { clipId: string }) => Promise<void>;
  deleteMany: (db: KyselyDB, input: { clipIds: string[] }) => Promise<{ storageKey: string }[]>;
  rename: (db: KyselyDB, input: { clipId: string; name: string }) => Promise<AudioClip>;
}
```

- [ ] **Step 2: Create the Kysely adapter**

`packages/modules/src/audio-clip/infrastructure/audio-clip-repository.kysely.ts`:

```ts
import type { AudioClip } from "../domain/index.js";
import type { FileType } from "../../file/domain/index.js";
import type { AudioClipRepoPort } from "./audio-clip-repository.port.js";

export const makeAudioClipRepo = (): AudioClipRepoPort => ({
  list: async (db, { trackId }) => {
    const rows = await db
      .selectFrom("audioClip")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select([
        "audioClip.id",
        "audioClip.trackId",
        "audioClip.fileId",
        "audioClip.name",
        "audioClip.durationMs",
        "audioClip.startMeasure",
        "audioClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("audioClip.trackId", "=", trackId)
      .execute();
    return rows.map(toAudioClip);
  },

  listBySong: async (db, { songId }) => {
    const rows = await db
      .selectFrom("audioClip")
      .innerJoin("track", "track.id", "audioClip.trackId")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select([
        "audioClip.id",
        "audioClip.trackId",
        "audioClip.fileId",
        "audioClip.name",
        "audioClip.durationMs",
        "audioClip.startMeasure",
        "audioClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("track.songId", "=", songId)
      .execute();
    return rows.map(toAudioClip);
  },

  findById: async (db, { clipId }) => {
    const row = await db
      .selectFrom("audioClip")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select([
        "audioClip.id",
        "audioClip.trackId",
        "audioClip.fileId",
        "audioClip.name",
        "audioClip.durationMs",
        "audioClip.startMeasure",
        "audioClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("audioClip.id", "=", clipId)
      .executeTakeFirst();
    return row ? toAudioClip(row) : null;
  },

  create: async (db, { id, trackId, fileId, durationMs, startMeasure }) => {
    await db
      .insertInto("audioClip")
      .values({
        id,
        trackId,
        fileId,
        durationMs: durationMs ?? null,
        startMeasure,
      })
      .execute();
    const row = await db
      .selectFrom("audioClip")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select([
        "audioClip.id",
        "audioClip.trackId",
        "audioClip.fileId",
        "audioClip.name",
        "audioClip.durationMs",
        "audioClip.startMeasure",
        "audioClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("audioClip.id", "=", id)
      .executeTakeFirstOrThrow();
    return toAudioClip(row);
  },

  updatePosition: async (db, { clipId, startMeasure, trackId }) => {
    const updates: { startMeasure: number; trackId?: string } = { startMeasure };
    if (trackId !== undefined) {
      updates.trackId = trackId;
    }
    await db
      .updateTable("audioClip")
      .set(updates)
      .where("id", "=", clipId)
      .execute();
    const row = await db
      .selectFrom("audioClip")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select([
        "audioClip.id",
        "audioClip.trackId",
        "audioClip.fileId",
        "audioClip.name",
        "audioClip.durationMs",
        "audioClip.startMeasure",
        "audioClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("audioClip.id", "=", clipId)
      .executeTakeFirstOrThrow();
    return toAudioClip(row);
  },

  rename: async (db, { clipId, name }) => {
    await db
      .updateTable("audioClip")
      .set({ name })
      .where("id", "=", clipId)
      .execute();
    const row = await db
      .selectFrom("audioClip")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select([
        "audioClip.id",
        "audioClip.trackId",
        "audioClip.fileId",
        "audioClip.name",
        "audioClip.durationMs",
        "audioClip.startMeasure",
        "audioClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("audioClip.id", "=", clipId)
      .executeTakeFirstOrThrow();
    return toAudioClip(row);
  },

  delete: async (db, { clipId }) => {
    await db.deleteFrom("audioClip").where("id", "=", clipId).execute();
  },

  deleteMany: async (db, { clipIds }) => {
    if (clipIds.length === 0) return [];
    const rows = await db
      .selectFrom("audioClip")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select(["file.storageKey"])
      .where("audioClip.id", "in", clipIds)
      .execute();
    await db.deleteFrom("audioClip").where("id", "in", clipIds).execute();
    return rows.map((r) => ({ storageKey: r.storageKey }));
  },
});

function toAudioClip(row: {
  id: string;
  trackId: string;
  fileId: string;
  name: string | null;
  durationMs: number | null;
  startMeasure: number;
  createdAt: Date;
  storageKey: string;
  filename: string;
  type: string;
  organizationId: string;
  fileCreatedAt: Date;
}): AudioClip {
  return {
    id: row.id,
    trackId: row.trackId,
    fileId: row.fileId,
    name: row.name,
    file: {
      id: row.fileId,
      storageKey: row.storageKey,
      filename: row.filename,
      type: row.type as FileType,
      organizationId: row.organizationId,
      createdAt: row.fileCreatedAt,
    },
    durationMs: row.durationMs,
    startMeasure: row.startMeasure,
    createdAt: row.createdAt,
  };
}
```

- [ ] **Step 3: Rewrite the infrastructure barrel**

Replace `packages/modules/src/audio-clip/infrastructure/index.ts` with:

```ts
export type { AudioClipRepoPort, AudioClip } from "./audio-clip-repository.port.js";
export { makeAudioClipRepo } from "./audio-clip-repository.kysely.js";
```

- [ ] **Step 4: Create the `app/` files**

`packages/modules/src/audio-clip/app/list-audio-clips.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort } from "../infrastructure/index.js";

export async function listAudioClips(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort },
  input: { songId: string },
) {
  return deps.audioClipRepo.listBySong(deps.db, { songId: input.songId });
}
```

`packages/modules/src/audio-clip/app/get-upload-url.ts`:

```ts
import type { FileStoragePort } from "../../file/infrastructure/index.js";

export async function getUploadUrl(
  deps: { fileStorage: FileStoragePort },
  input: { filename: string; contentType: string; organizationId: string },
) {
  const fileId = crypto.randomUUID();
  const storageKey = `${input.organizationId}/audio-clips/${fileId}-${input.filename}`;
  const uploadUrl = await deps.fileStorage.getUploadUrl({
    key: storageKey,
    contentType: input.contentType,
  });
  return { storageKey, uploadUrl };
}
```

`packages/modules/src/audio-clip/app/register-audio-clip.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort } from "../infrastructure/index.js";
import type { FileRepoPort } from "../../file/infrastructure/index.js";

export async function registerAudioClip(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort; fileRepo: FileRepoPort },
  input: {
    trackId: string;
    filename: string;
    storageKey: string;
    organizationId: string;
    startMeasure: number;
    durationMs?: number | null;
  },
) {
  const fileId = crypto.randomUUID();
  await deps.fileRepo.create(deps.db, {
    id: fileId,
    storageKey: input.storageKey,
    filename: input.filename,
    type: "audio",
    organizationId: input.organizationId,
  });
  return deps.audioClipRepo.create(deps.db, {
    id: crypto.randomUUID(),
    trackId: input.trackId,
    fileId,
    durationMs: input.durationMs,
    startMeasure: input.startMeasure,
  });
}
```

`packages/modules/src/audio-clip/app/update-audio-clip-position.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort } from "../infrastructure/index.js";
import type { TrackRepoPort } from "../../track/infrastructure/index.js";
import { notFound, conflict } from "@echo/errors";

export async function updateAudioClipPosition(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort; trackRepo: TrackRepoPort },
  input: { clipId: string; startMeasure: number; trackId?: string },
) {
  if (input.trackId !== undefined) {
    const clip = await deps.audioClipRepo.findById(deps.db, { clipId: input.clipId });
    if (!clip) {
      throw notFound("AudioClip");
    }

    const currentTrack = await deps.trackRepo.findById(deps.db, { trackId: clip.trackId });
    if (!currentTrack) {
      throw notFound("Track");
    }

    const targetTrack = await deps.trackRepo.findById(deps.db, { trackId: input.trackId });
    if (!targetTrack) {
      throw notFound("Track");
    }

    if (currentTrack.songId !== targetTrack.songId) {
      throw conflict("Target track does not belong to the same song");
    }
  }

  return deps.audioClipRepo.updatePosition(deps.db, {
    clipId: input.clipId,
    startMeasure: input.startMeasure,
    trackId: input.trackId,
  });
}
```

`packages/modules/src/audio-clip/app/delete-audio-clip.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort } from "../infrastructure/index.js";
import type { FileStoragePort } from "../../file/infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function deleteAudioClip(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort; fileStorage: FileStoragePort },
  input: { clipId: string },
) {
  const clip = await deps.audioClipRepo.findById(deps.db, { clipId: input.clipId });
  if (!clip) throw notFound("AudioClip");
  await deps.audioClipRepo.delete(deps.db, { clipId: input.clipId });
  await deps.fileStorage.deleteFile({ key: clip.file.storageKey });
}
```

`packages/modules/src/audio-clip/app/delete-many-audio-clips.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort } from "../infrastructure/index.js";
import type { FileStoragePort } from "../../file/infrastructure/index.js";

export async function deleteManyAudioClips(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort; fileStorage: FileStoragePort },
  input: { clipIds: string[] },
) {
  if (input.clipIds.length === 0) return;
  const deleted = await deps.audioClipRepo.deleteMany(deps.db, { clipIds: input.clipIds });
  await Promise.allSettled(
    deleted.map(({ storageKey }) => deps.fileStorage.deleteFile({ key: storageKey })),
  );
}
```

`packages/modules/src/audio-clip/app/get-signed-urls.ts`:

```ts
import type { FileStoragePort } from "../../file/infrastructure/index.js";

export async function getSignedUrls(
  deps: { fileStorage: FileStoragePort },
  input: { storageKeys: string[] },
) {
  return Promise.all(
    input.storageKeys.map(async (key) => ({
      key,
      url: await deps.fileStorage.getDownloadUrl({ key }),
    })),
  );
}
```

`packages/modules/src/audio-clip/app/rename-audio-clip.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort, AudioClip } from "../infrastructure/index.js";

export async function renameAudioClip(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort },
  input: { clipId: string; name: string },
): Promise<AudioClip> {
  return deps.audioClipRepo.rename(deps.db, input);
}
```

- [ ] **Step 5: Create the `app/` barrel**

`packages/modules/src/audio-clip/app/index.ts`:

```ts
export { listAudioClips } from "./list-audio-clips.js";
export { getUploadUrl } from "./get-upload-url.js";
export { registerAudioClip } from "./register-audio-clip.js";
export { updateAudioClipPosition } from "./update-audio-clip-position.js";
export { deleteAudioClip } from "./delete-audio-clip.js";
export { deleteManyAudioClips } from "./delete-many-audio-clips.js";
export { getSignedUrls } from "./get-signed-urls.js";
export { renameAudioClip } from "./rename-audio-clip.js";
```

- [ ] **Step 6: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/audio-clip/use-cases
```

- [ ] **Step 7: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./audio-clip/use-cases": {
      "types": "./src/audio-clip/use-cases/index.ts",
      "default": "./src/audio-clip/use-cases/index.ts"
    },
```

with:

```json
    "./audio-clip/app": {
      "types": "./src/audio-clip/app/index.ts",
      "default": "./src/audio-clip/app/index.ts"
    },
```

- [ ] **Step 8: Update the audio-clip router**

Replace the entire contents of `apps/api/src/router/organizations/audio-clip.ts` with:

```ts
import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  listAudioClips,
  getUploadUrl,
  registerAudioClip,
  updateAudioClipPosition,
  deleteAudioClip,
  deleteManyAudioClips,
  getSignedUrls,
  renameAudioClip,
} from "@echo/modules/audio-clip/app";

export const makeAudioClipRouter = () =>
  router({
    listBySong: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        return listAudioClips({ db: ctx.db, audioClipRepo: ctx.audioClip }, {
          songId: input.songId,
        });
      }),

    getUploadUrl: authedProcedure
      .input(
        z.object({
          filename: z.string().min(1),
          contentType: z.string().min(1),
          organizationId: z.string().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return getUploadUrl({ fileStorage: ctx.fileStorage }, {
          filename: input.filename,
          contentType: input.contentType,
          organizationId: input.organizationId,
        });
      }),

    register: authedProcedure
      .input(
        z.object({
          trackId: z.string().min(1),
          filename: z.string().min(1),
          storageKey: z.string().min(1),
          organizationId: z.string().min(1),
          startMeasure: z.number().positive(),
          durationMs: z.number().int().positive().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return registerAudioClip(
          { db: ctx.db, audioClipRepo: ctx.audioClip, fileRepo: ctx.file },
          {
            trackId: input.trackId,
            filename: input.filename,
            storageKey: input.storageKey,
            organizationId: input.organizationId,
            startMeasure: input.startMeasure,
            durationMs: input.durationMs,
          },
        );
      }),

    updatePosition: authedProcedure
      .input(
        z.object({
          clipId: z.string().min(1),
          startMeasure: z.number().positive(),
          trackId: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return updateAudioClipPosition(
          { db: ctx.db, audioClipRepo: ctx.audioClip, trackRepo: ctx.track },
          {
            clipId: input.clipId,
            startMeasure: input.startMeasure,
            trackId: input.trackId,
          },
        );
      }),

    delete: authedProcedure
      .input(z.object({ clipId: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return deleteAudioClip(
          { db: ctx.db, audioClipRepo: ctx.audioClip, fileStorage: ctx.fileStorage },
          { clipId: input.clipId },
        );
      }),

    getDownloadUrls: authedProcedure
      .input(z.object({ storageKeys: z.array(z.string()) }))
      .query(async ({ input, ctx }) => {
        return getSignedUrls({ fileStorage: ctx.fileStorage }, {
          storageKeys: input.storageKeys,
        });
      }),

    rename: authedProcedure
      .input(z.object({ clipId: z.string().min(1), name: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return renameAudioClip({ db: ctx.db, audioClipRepo: ctx.audioClip }, input);
      }),

    deleteMany: authedProcedure
      .input(z.object({ clipIds: z.array(z.string().min(1)).min(1) }))
      .mutation(async ({ input, ctx }) => {
        return deleteManyAudioClips(
          { db: ctx.db, audioClipRepo: ctx.audioClip, fileStorage: ctx.fileStorage },
          { clipIds: input.clipIds },
        );
      }),
  });
```

- [ ] **Step 9: Update `context.ts`**

Change:

```ts
      const audioClip = makeAudioClipRepo({ db });
```

to:

```ts
      const audioClip = makeAudioClipRepo();
```

- [ ] **Step 10: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add packages/modules/src/audio-clip packages/modules/package.json apps/api/src/router/organizations/audio-clip.ts apps/api/src/context.ts
git commit -m "refactor(audio-clip): split module into app/port/adapter files, thread db per call"
```

---

## Task 7: `midi-clip` module

**Files:**
- Create: `packages/modules/src/midi-clip/infrastructure/midi-clip-repository.port.ts`
- Create: `packages/modules/src/midi-clip/infrastructure/midi-clip-repository.kysely.ts`
- Modify: `packages/modules/src/midi-clip/infrastructure/index.ts`
- Create: `packages/modules/src/midi-clip/app/register-midi-clip.ts`
- Create: `packages/modules/src/midi-clip/app/list-midi-clips-by-song.ts`
- Create: `packages/modules/src/midi-clip/app/update-midi-clip-position.ts`
- Create: `packages/modules/src/midi-clip/app/rename-midi-clip.ts`
- Create: `packages/modules/src/midi-clip/app/delete-midi-clip.ts`
- Create: `packages/modules/src/midi-clip/app/delete-many-midi-clips.ts`
- Create: `packages/modules/src/midi-clip/app/index.ts`
- Delete: `packages/modules/src/midi-clip/use-cases/index.ts`
- Modify: `packages/modules/package.json`
- Modify: `apps/api/src/router/organizations/midi-clip.ts`
- Modify: `apps/api/src/context.ts`

**Interfaces:**
- Consumes: `MidiClip` domain type (unchanged), `FileType` from `file/domain`, `TrackRepoPort` (Task 1), `FileRepoPort` (Task 5), `getSignedUrls` from `audio-clip/app` (Task 6).
- Produces: `MidiClipRepoPort` (methods take `db: KyselyDB` first), `makeMidiClipRepo()`, and 6 exported async functions.

- [ ] **Step 1: Create the port file**

`packages/modules/src/midi-clip/infrastructure/midi-clip-repository.port.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { MidiClip } from "../domain/index.js";

export type { MidiClip };

export type CreateMidiClipInput = {
  id: string;
  trackId: string;
  fileId: string;
  startMeasure: number;
  durationMs: number | null;
};

export interface MidiClipRepoPort {
  listBySong: (db: KyselyDB, input: { songId: string }) => Promise<MidiClip[]>;
  findById: (db: KyselyDB, input: { clipId: string }) => Promise<MidiClip | null>;
  create: (db: KyselyDB, input: CreateMidiClipInput) => Promise<MidiClip>;
  updatePosition: (
    db: KyselyDB,
    input: { clipId: string; startMeasure: number; trackId?: string },
  ) => Promise<MidiClip>;
  rename: (db: KyselyDB, input: { clipId: string; name: string }) => Promise<MidiClip>;
  delete: (db: KyselyDB, input: { clipId: string }) => Promise<void>;
  deleteMany: (db: KyselyDB, input: { clipIds: string[] }) => Promise<void>;
}
```

- [ ] **Step 2: Create the Kysely adapter**

`packages/modules/src/midi-clip/infrastructure/midi-clip-repository.kysely.ts`:

```ts
import type { MidiClip } from "../domain/index.js";
import type { FileType } from "../../file/domain/index.js";
import type { MidiClipRepoPort } from "./midi-clip-repository.port.js";

export const makeMidiClipRepo = (): MidiClipRepoPort => ({
  listBySong: async (db, { songId }) => {
    const rows = await db
      .selectFrom("midiClip")
      .innerJoin("track", "track.id", "midiClip.trackId")
      .innerJoin("file", "file.id", "midiClip.fileId")
      .select([
        "midiClip.id",
        "midiClip.trackId",
        "midiClip.fileId",
        "midiClip.name",
        "midiClip.durationMs",
        "midiClip.startMeasure",
        "midiClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("track.songId", "=", songId)
      .orderBy("midiClip.startMeasure", "asc")
      .execute();
    return rows.map(toMidiClip);
  },

  findById: async (db, { clipId }) => {
    const row = await db
      .selectFrom("midiClip")
      .innerJoin("file", "file.id", "midiClip.fileId")
      .select([
        "midiClip.id",
        "midiClip.trackId",
        "midiClip.fileId",
        "midiClip.name",
        "midiClip.durationMs",
        "midiClip.startMeasure",
        "midiClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("midiClip.id", "=", clipId)
      .executeTakeFirst();
    return row ? toMidiClip(row) : null;
  },

  create: async (db, { id, trackId, fileId, startMeasure, durationMs }) => {
    await db
      .insertInto("midiClip")
      .values({ id, trackId, fileId, startMeasure, durationMs: durationMs ?? null })
      .execute();
    const row = await db
      .selectFrom("midiClip")
      .innerJoin("file", "file.id", "midiClip.fileId")
      .select([
        "midiClip.id",
        "midiClip.trackId",
        "midiClip.fileId",
        "midiClip.name",
        "midiClip.durationMs",
        "midiClip.startMeasure",
        "midiClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("midiClip.id", "=", id)
      .executeTakeFirstOrThrow();
    return toMidiClip(row);
  },

  updatePosition: async (db, { clipId, startMeasure, trackId }) => {
    const updates: { startMeasure: number; trackId?: string } = { startMeasure };
    if (trackId !== undefined) {
      updates.trackId = trackId;
    }
    await db
      .updateTable("midiClip")
      .set(updates)
      .where("id", "=", clipId)
      .execute();
    const row = await db
      .selectFrom("midiClip")
      .innerJoin("file", "file.id", "midiClip.fileId")
      .select([
        "midiClip.id",
        "midiClip.trackId",
        "midiClip.fileId",
        "midiClip.name",
        "midiClip.durationMs",
        "midiClip.startMeasure",
        "midiClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("midiClip.id", "=", clipId)
      .executeTakeFirstOrThrow();
    return toMidiClip(row);
  },

  rename: async (db, { clipId, name }) => {
    await db
      .updateTable("midiClip")
      .set({ name })
      .where("id", "=", clipId)
      .execute();
    const row = await db
      .selectFrom("midiClip")
      .innerJoin("file", "file.id", "midiClip.fileId")
      .select([
        "midiClip.id",
        "midiClip.trackId",
        "midiClip.fileId",
        "midiClip.name",
        "midiClip.durationMs",
        "midiClip.startMeasure",
        "midiClip.createdAt",
        "file.storageKey",
        "file.filename",
        "file.type",
        "file.organizationId",
        "file.createdAt as fileCreatedAt",
      ])
      .where("midiClip.id", "=", clipId)
      .executeTakeFirstOrThrow();
    return toMidiClip(row);
  },

  delete: async (db, { clipId }) => {
    await db.deleteFrom("midiClip").where("id", "=", clipId).execute();
  },

  deleteMany: async (db, { clipIds }) => {
    if (clipIds.length === 0) return;
    await db.deleteFrom("midiClip").where("id", "in", clipIds).execute();
  },
});

function toMidiClip(row: {
  id: string;
  trackId: string;
  fileId: string;
  name: string | null;
  durationMs: number | null;
  startMeasure: number;
  createdAt: Date;
  storageKey: string;
  filename: string;
  type: string;
  organizationId: string;
  fileCreatedAt: Date;
}): MidiClip {
  return {
    id: row.id,
    trackId: row.trackId,
    fileId: row.fileId,
    name: row.name,
    file: {
      id: row.fileId,
      storageKey: row.storageKey,
      filename: row.filename,
      type: row.type as FileType,
      organizationId: row.organizationId,
      createdAt: row.fileCreatedAt,
    },
    durationMs: row.durationMs,
    startMeasure: row.startMeasure,
    createdAt: row.createdAt,
  };
}
```

- [ ] **Step 3: Rewrite the infrastructure barrel**

Replace `packages/modules/src/midi-clip/infrastructure/index.ts` with:

```ts
export type { MidiClipRepoPort, MidiClip, CreateMidiClipInput } from "./midi-clip-repository.port.js";
export { makeMidiClipRepo } from "./midi-clip-repository.kysely.js";
```

- [ ] **Step 4: Create the `app/` files**

`packages/modules/src/midi-clip/app/register-midi-clip.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";
import type { FileRepoPort } from "../../file/infrastructure/index.js";
import { randomUUID } from "node:crypto";

export async function registerMidiClip(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort; fileRepo: FileRepoPort },
  input: {
    trackId: string;
    filename: string;
    storageKey: string;
    organizationId: string;
    startMeasure: number;
    durationMs?: number | null;
  },
) {
  const fileId = randomUUID();
  await deps.fileRepo.create(deps.db, {
    id: fileId,
    storageKey: input.storageKey,
    filename: input.filename,
    type: "midi",
    organizationId: input.organizationId,
  });

  return deps.midiClipRepo.create(deps.db, {
    id: randomUUID(),
    trackId: input.trackId,
    fileId,
    startMeasure: input.startMeasure,
    durationMs: input.durationMs ?? null,
  });
}
```

`packages/modules/src/midi-clip/app/list-midi-clips-by-song.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";

export async function listMidiClipsBySong(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort },
  input: { songId: string },
) {
  return deps.midiClipRepo.listBySong(deps.db, { songId: input.songId });
}
```

`packages/modules/src/midi-clip/app/update-midi-clip-position.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";
import type { TrackRepoPort } from "../../track/infrastructure/index.js";
import { notFound, conflict } from "@echo/errors";

export async function updateMidiClipPosition(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort; trackRepo: TrackRepoPort },
  input: { clipId: string; startMeasure: number; trackId?: string },
) {
  if (input.startMeasure < 1) {
    throw conflict("Start measure must be >= 1");
  }

  if (input.trackId !== undefined) {
    const clip = await deps.midiClipRepo.findById(deps.db, { clipId: input.clipId });
    if (!clip) {
      throw notFound("MidiClip");
    }

    const currentTrack = await deps.trackRepo.findById(deps.db, { trackId: clip.trackId });
    if (!currentTrack) {
      throw notFound("Track");
    }

    const targetTrack = await deps.trackRepo.findById(deps.db, { trackId: input.trackId });
    if (!targetTrack) {
      throw notFound("Track");
    }

    if (currentTrack.songId !== targetTrack.songId) {
      throw conflict("Target track does not belong to the same song");
    }
  }

  return deps.midiClipRepo.updatePosition(deps.db, {
    clipId: input.clipId,
    startMeasure: input.startMeasure,
    trackId: input.trackId,
  });
}
```

`packages/modules/src/midi-clip/app/rename-midi-clip.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";
import { conflict } from "@echo/errors";

export async function renameMidiClip(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort },
  input: { clipId: string; name: string },
) {
  if (!input.name.trim()) {
    throw conflict("Clip name cannot be empty");
  }
  return deps.midiClipRepo.rename(deps.db, {
    clipId: input.clipId,
    name: input.name.trim(),
  });
}
```

`packages/modules/src/midi-clip/app/delete-midi-clip.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";

export async function deleteMidiClip(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort },
  input: { clipId: string },
) {
  return deps.midiClipRepo.delete(deps.db, { clipId: input.clipId });
}
```

`packages/modules/src/midi-clip/app/delete-many-midi-clips.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";

export async function deleteManyMidiClips(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort },
  input: { clipIds: string[] },
) {
  if (input.clipIds.length === 0) return;
  await deps.midiClipRepo.deleteMany(deps.db, { clipIds: input.clipIds });
}
```

- [ ] **Step 5: Create the `app/` barrel**

`packages/modules/src/midi-clip/app/index.ts`:

```ts
export { registerMidiClip } from "./register-midi-clip.js";
export { listMidiClipsBySong } from "./list-midi-clips-by-song.js";
export { updateMidiClipPosition } from "./update-midi-clip-position.js";
export { renameMidiClip } from "./rename-midi-clip.js";
export { deleteMidiClip } from "./delete-midi-clip.js";
export { deleteManyMidiClips } from "./delete-many-midi-clips.js";
```

- [ ] **Step 6: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/midi-clip/use-cases
```

- [ ] **Step 7: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./midi-clip/use-cases": {
      "types": "./src/midi-clip/use-cases/index.ts",
      "default": "./src/midi-clip/use-cases/index.ts"
    },
```

with:

```json
    "./midi-clip/app": {
      "types": "./src/midi-clip/app/index.ts",
      "default": "./src/midi-clip/app/index.ts"
    },
```

- [ ] **Step 8: Update the midi-clip router**

Replace the entire contents of `apps/api/src/router/organizations/midi-clip.ts` with:

```ts
import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  registerMidiClip,
  listMidiClipsBySong,
  updateMidiClipPosition,
  renameMidiClip,
  deleteMidiClip,
  deleteManyMidiClips,
} from "@echo/modules/midi-clip/app";
import { getSignedUrls } from "@echo/modules/audio-clip/app";

export const makeMidiClipRouter = () =>
  router({
    listBySong: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        return listMidiClipsBySong({ db: ctx.db, midiClipRepo: ctx.midiClip }, {
          songId: input.songId,
        });
      }),

    register: authedProcedure
      .input(
        z.object({
          trackId: z.string().min(1),
          filename: z.string().min(1),
          storageKey: z.string().min(1),
          organizationId: z.string().min(1),
          startMeasure: z.number().positive(),
          durationMs: z.number().int().positive().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return registerMidiClip(
          { db: ctx.db, midiClipRepo: ctx.midiClip, fileRepo: ctx.file },
          {
            trackId: input.trackId,
            filename: input.filename,
            storageKey: input.storageKey,
            organizationId: input.organizationId,
            startMeasure: input.startMeasure,
            durationMs: input.durationMs,
          },
        );
      }),

    updatePosition: authedProcedure
      .input(
        z.object({
          clipId: z.string().min(1),
          startMeasure: z.number().positive(),
          trackId: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return updateMidiClipPosition(
          { db: ctx.db, midiClipRepo: ctx.midiClip, trackRepo: ctx.track },
          {
            clipId: input.clipId,
            startMeasure: input.startMeasure,
            trackId: input.trackId,
          },
        );
      }),

    rename: authedProcedure
      .input(z.object({ clipId: z.string().min(1), name: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return renameMidiClip({ db: ctx.db, midiClipRepo: ctx.midiClip }, input);
      }),

    delete: authedProcedure
      .input(z.object({ clipId: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return deleteMidiClip({ db: ctx.db, midiClipRepo: ctx.midiClip }, input);
      }),

    getDownloadUrls: authedProcedure
      .input(z.object({ storageKeys: z.array(z.string()) }))
      .query(async ({ input, ctx }) => {
        return getSignedUrls({ fileStorage: ctx.fileStorage }, {
          storageKeys: input.storageKeys,
        });
      }),

    deleteMany: authedProcedure
      .input(z.object({ clipIds: z.array(z.string().min(1)).min(1) }))
      .mutation(async ({ input, ctx }) => {
        return deleteManyMidiClips({ db: ctx.db, midiClipRepo: ctx.midiClip }, {
          clipIds: input.clipIds,
        });
      }),
  });
```

- [ ] **Step 9: Update `context.ts`**

Change:

```ts
      const midiClip = makeMidiClipRepo({ db });
```

to:

```ts
      const midiClip = makeMidiClipRepo();
```

- [ ] **Step 10: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add packages/modules/src/midi-clip packages/modules/package.json apps/api/src/router/organizations/midi-clip.ts apps/api/src/context.ts
git commit -m "refactor(midi-clip): split module into app/port/adapter files, thread db per call"
```

---

## Task 8: `invitation` module

**Files:**
- Create: `packages/modules/src/invitation/infrastructure/invitation-repository.port.ts`
- Create: `packages/modules/src/invitation/infrastructure/invitation-repository.kysely.ts`
- Modify: `packages/modules/src/invitation/infrastructure/index.ts`
- Create: `packages/modules/src/invitation/app/get-invitation.ts`
- Create: `packages/modules/src/invitation/app/index.ts`
- Delete: `packages/modules/src/invitation/use-cases/index.ts`
- Modify: `packages/modules/package.json`
- Modify: `apps/api/src/router/invitation.ts`
- Modify: `apps/api/src/context.ts`

**Interfaces:**
- Consumes: `InvitationDetails` domain type (unchanged).
- Produces: `InvitationRepoPort` (`getById` takes `db: KyselyDB` first), `makeInvitationRepo()`, `getInvitation(deps, input)`.

- [ ] **Step 1: Create the port file**

`packages/modules/src/invitation/infrastructure/invitation-repository.port.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { InvitationDetails } from "../domain/index.js";

export type { InvitationDetails };

export interface InvitationRepoPort {
  getById: (db: KyselyDB, id: string) => Promise<InvitationDetails | null>;
}
```

- [ ] **Step 2: Create the Kysely adapter**

`packages/modules/src/invitation/infrastructure/invitation-repository.kysely.ts`:

```ts
import type { InvitationRepoPort } from "./invitation-repository.port.js";

export const makeInvitationRepo = (): InvitationRepoPort => ({
  getById: async (db, id) => {
    const row = await db
      .selectFrom("invitation")
      .leftJoin("organization", "organization.id", "invitation.organizationId")
      .select([
        "invitation.id",
        "invitation.email",
        "invitation.role",
        "invitation.status",
        "invitation.expiresAt",
        "organization.name as orgName",
        "organization.slug as orgSlug",
      ])
      .where("invitation.id", "=", id)
      .executeTakeFirst();

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      expiresAt: row.expiresAt,
      organizationName: row.orgName,
      organizationSlug: row.orgSlug,
    };
  },
});
```

- [ ] **Step 3: Rewrite the infrastructure barrel**

Replace `packages/modules/src/invitation/infrastructure/index.ts` with:

```ts
export type { InvitationRepoPort, InvitationDetails } from "./invitation-repository.port.js";
export { makeInvitationRepo } from "./invitation-repository.kysely.js";
```

- [ ] **Step 4: Create the `app/` file**

`packages/modules/src/invitation/app/get-invitation.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { InvitationRepoPort } from "../infrastructure/index.js";

export function getInvitation(
  deps: { db: KyselyDB; invitationRepo: InvitationRepoPort },
  input: { id: string },
) {
  return deps.invitationRepo.getById(deps.db, input.id);
}
```

- [ ] **Step 5: Create the `app/` barrel**

`packages/modules/src/invitation/app/index.ts`:

```ts
export { getInvitation } from "./get-invitation.js";
```

- [ ] **Step 6: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/invitation/use-cases
```

- [ ] **Step 7: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./invitation/use-cases": {
      "types": "./src/invitation/use-cases/index.ts",
      "default": "./src/invitation/use-cases/index.ts"
    },
```

with:

```json
    "./invitation/app": {
      "types": "./src/invitation/app/index.ts",
      "default": "./src/invitation/app/index.ts"
    },
```

- [ ] **Step 8: Update the invitation router**

Replace the entire contents of `apps/api/src/router/invitation.ts` with:

```ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getInvitation } from "@echo/modules/invitation/app";

export const makeInvitationRouter = () =>
  router({
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input, ctx }) =>
        getInvitation({ db: ctx.db, invitationRepo: ctx.invitation }, { id: input.id }),
      ),
  });
```

- [ ] **Step 9: Update `context.ts`**

Change:

```ts
      const invitation = makeInvitationRepo({ db });
```

to:

```ts
      const invitation = makeInvitationRepo();
```

- [ ] **Step 10: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add packages/modules/src/invitation packages/modules/package.json apps/api/src/router/invitation.ts apps/api/src/context.ts
git commit -m "refactor(invitation): split module into app/port/adapter files, thread db per call"
```

---

## Task 9: `health` module

**Files:**
- Create: `packages/modules/src/health/infrastructure/health-repository.port.ts`
- Create: `packages/modules/src/health/infrastructure/health-repository.kysely.ts`
- Modify: `packages/modules/src/health/infrastructure/index.ts`
- Create: `packages/modules/src/health/app/health-check.ts`
- Create: `packages/modules/src/health/app/index.ts`
- Delete: `packages/modules/src/health/use-cases/index.ts`
- Modify: `packages/modules/package.json`
- Modify: `apps/api/src/router/health.ts`
- Modify: `apps/api/src/context.ts`

**Interfaces:**
- Consumes: nothing (health has no domain types).
- Produces: `HealthCheckPort` (`check` takes `db: KyselyDB`), `makeHealthRepo()`, `healthCheck(deps)`.

- [ ] **Step 1: Create the port file**

`packages/modules/src/health/infrastructure/health-repository.port.ts`:

```ts
import type { KyselyDB } from "@echo/db";

export interface HealthCheckPort {
  check: (db: KyselyDB) => Promise<boolean>;
}
```

- [ ] **Step 2: Create the Kysely adapter**

`packages/modules/src/health/infrastructure/health-repository.kysely.ts`:

```ts
import { sql } from "kysely";
import type { HealthCheckPort } from "./health-repository.port.js";

export const makeHealthRepo = (): HealthCheckPort => ({
  check: async (db) => {
    try {
      await sql`SELECT 1`.execute(db);
      return true;
    } catch {
      return false;
    }
  },
});
```

- [ ] **Step 3: Rewrite the infrastructure barrel**

Replace `packages/modules/src/health/infrastructure/index.ts` with:

```ts
export type { HealthCheckPort } from "./health-repository.port.js";
export { makeHealthRepo } from "./health-repository.kysely.js";
```

- [ ] **Step 4: Create the `app/` file**

`packages/modules/src/health/app/health-check.ts`:

```ts
import type { KyselyDB } from "@echo/db";
import type { HealthCheckPort } from "../infrastructure/index.js";

export async function healthCheck(deps: { db: KyselyDB; healthCheck: HealthCheckPort }) {
  const dbConnected = await deps.healthCheck.check(deps.db);
  return {
    status: dbConnected ? "ok" : "degraded",
    db: dbConnected,
  } as const;
}
```

- [ ] **Step 5: Create the `app/` barrel**

`packages/modules/src/health/app/index.ts`:

```ts
export { healthCheck } from "./health-check.js";
```

- [ ] **Step 6: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/health/use-cases
```

- [ ] **Step 7: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./health/use-cases": {
      "types": "./src/health/use-cases/index.ts",
      "default": "./src/health/use-cases/index.ts"
    },
```

with:

```json
    "./health/app": {
      "types": "./src/health/app/index.ts",
      "default": "./src/health/app/index.ts"
    },
```

- [ ] **Step 8: Update the health router**

Replace the entire contents of `apps/api/src/router/health.ts` with:

```ts
import { router, publicProcedure } from "../trpc";
import { healthCheck } from "@echo/modules/health/app";

export const makeHealthRouter = () =>
  router({
    health: publicProcedure.query(({ ctx }) =>
      healthCheck({ db: ctx.db, healthCheck: ctx.health }),
    ),
  });
```

- [ ] **Step 9: Update `context.ts`**

Change:

```ts
      const health = makeHealthRepo({ db });
```

to:

```ts
      const health = makeHealthRepo();
```

- [ ] **Step 10: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add packages/modules/src/health packages/modules/package.json apps/api/src/router/health.ts apps/api/src/context.ts
git commit -m "refactor(health): split module into app/port/adapter files, thread db per call"
```

---

## Task 10: `user` module

The `UserPermissionRepoPort` never touches `db` (wraps better-auth's API) — pure file split, no signature changes, no `context.ts` change.

**Files:**
- Create: `packages/modules/src/user/infrastructure/user-permission-repository.port.ts`
- Create: `packages/modules/src/user/infrastructure/user-permission-repository.better-auth.ts`
- Modify: `packages/modules/src/user/infrastructure/index.ts`
- Create: `packages/modules/src/user/app/index.ts`
- Delete: `packages/modules/src/user/use-cases/index.ts`
- Modify: `packages/modules/package.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: `UserPermissionRepoPort`, `makeUserPermissionRepo({ auth, userId, headers })` (unchanged signature).

- [ ] **Step 1: Create the port file**

`packages/modules/src/user/infrastructure/user-permission-repository.port.ts`:

```ts
import type { OrganizationRole, ServerAuth, SystemRole } from "@echo/auth";

type UserHasPermissionBody = NonNullable<
  Parameters<ServerAuth["api"]["userHasPermission"]>[0]
>["body"];
type UserHasPermissionInOrganization = NonNullable<
  Parameters<ServerAuth["api"]["hasPermission"]>[0]
>["body"];

export interface UserPermissionRepoPort {
  userHasPermission: (input: {
    permissions: UserHasPermissionBody["permissions"];
    role?: SystemRole;
  }) => ReturnType<ServerAuth["api"]["userHasPermission"]>;

  userHasPermissionInOrganization: (input: {
    organizationId?: string | null;
    permissions: UserHasPermissionInOrganization["permissions"];
  }) => Promise<
    Awaited<ReturnType<ServerAuth["api"]["userHasPermission"]>> & {
      role: OrganizationRole | null;
    }
  >;
}
```

- [ ] **Step 2: Create the adapter**

`packages/modules/src/user/infrastructure/user-permission-repository.better-auth.ts`:

```ts
import type { ServerAuth } from "@echo/auth";
import type { UserPermissionRepoPort } from "./user-permission-repository.port.js";

export const makeUserPermissionRepo = ({
  auth,
  userId,
  headers,
}: {
  auth: ServerAuth;
  userId?: string;
  headers: Headers;
}): UserPermissionRepoPort => {
  return {
    userHasPermission: async ({ permissions, role }) => {
      if (!userId) return { success: false, error: null };
      return await auth.api.userHasPermission({
        body: {
          userId,
          permissions: permissions ?? {},
          role,
        },
      });
    },

    userHasPermissionInOrganization: async ({ permissions, organizationId }) => {
      if (!userId || !organizationId) return { success: false, error: null, role: null };

      const activeOrganization = await auth.api.getFullOrganization({ headers });

      if (activeOrganization?.id !== organizationId) {
        return { success: false, error: null, role: null };
      }

      const { success, error } = await auth.api.hasPermission({
        headers,
        body: {
          permissions: permissions ?? {},
        },
      });

      const { role } = await auth.api.getActiveMemberRole({ headers });

      return { success, error, role };
    },
  };
};
```

- [ ] **Step 3: Rewrite the infrastructure barrel**

Replace `packages/modules/src/user/infrastructure/index.ts` with:

```ts
export type { UserPermissionRepoPort } from "./user-permission-repository.port.js";
export { makeUserPermissionRepo } from "./user-permission-repository.better-auth.js";
```

- [ ] **Step 4: Create the `app/` placeholder**

`packages/modules/src/user/app/index.ts`:

```ts
// User use-cases are handled via better-auth APIs and domain permission predicates
export {};
```

- [ ] **Step 5: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/user/use-cases
```

- [ ] **Step 6: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./user/use-cases": {
      "types": "./src/user/use-cases/index.ts",
      "default": "./src/user/use-cases/index.ts"
    },
```

with:

```json
    "./user/app": {
      "types": "./src/user/app/index.ts",
      "default": "./src/user/app/index.ts"
    },
```

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/modules/src/user packages/modules/package.json
git commit -m "refactor(user): split module into app/port/adapter files"
```

---

## Task 11: `notification` module

Two concerns: `MailerPort` (nodemailer transport) and `EmailNotifierPort` (rendering + sending). Neither touches `db`.

**Files:**
- Create: `packages/modules/src/notification/infrastructure/mailer.port.ts`
- Create: `packages/modules/src/notification/infrastructure/mailer.nodemailer.ts`
- Create: `packages/modules/src/notification/infrastructure/email-notifier.port.ts`
- Create: `packages/modules/src/notification/infrastructure/email-notifier.ts`
- Modify: `packages/modules/src/notification/infrastructure/index.ts`
- Create: `packages/modules/src/notification/app/index.ts`
- Delete: `packages/modules/src/notification/use-cases/index.ts`
- Modify: `packages/modules/package.json`

**Interfaces:**
- Consumes: `renderInvitationEmail`, `renderResetPasswordEmail` from `./templates/index.ts` (unchanged), `makeServerI18n` from `@echo/i18n` (unchanged).
- Produces: `MailerPort`, `makeMailer(config)`; `EmailNotifierPort`, `makeEmailNotifierRepo({ mailer, appBaseUrl })` (both unchanged signatures — no `db`).

- [ ] **Step 1: Create the mailer port**

`packages/modules/src/notification/infrastructure/mailer.port.ts`:

```ts
export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export interface MailerPort {
  send: (options: SendMailOptions) => Promise<void>;
}

export type MailerConfig = { host: string; port: number; from: string };
```

- [ ] **Step 2: Create the nodemailer adapter**

`packages/modules/src/notification/infrastructure/mailer.nodemailer.ts`:

```ts
import nodemailer from "nodemailer";
import type { MailerPort, MailerConfig, SendMailOptions } from "./mailer.port.js";

export const makeMailer = (config: MailerConfig): MailerPort => {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
  });
  return {
    send: async (options: SendMailOptions) => {
      await transport.sendMail({
        from: config.from,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
      });
    },
  };
};
```

- [ ] **Step 3: Create the email-notifier port**

`packages/modules/src/notification/infrastructure/email-notifier.port.ts`:

```ts
export interface EmailNotifierPort {
  sendUserInvitationToJoinOrganization: (opts: {
    to: string;
    orgName: string;
    invitationId: string;
  }) => Promise<void>;

  sendUserResetPassword: (opts: { to: string; token: string }) => Promise<void>;
}
```

- [ ] **Step 4: Create the email-notifier adapter**

`packages/modules/src/notification/infrastructure/email-notifier.ts`:

```ts
import { makeServerI18n } from "@echo/i18n";
import type { MailerPort } from "./mailer.port.js";
import type { EmailNotifierPort } from "./email-notifier.port.js";
import { renderInvitationEmail, renderResetPasswordEmail } from "./templates/index.js";

export const makeEmailNotifierRepo = ({
  mailer,
  appBaseUrl,
}: {
  mailer: MailerPort;
  appBaseUrl: string;
}): EmailNotifierPort => {
  const t = makeServerI18n();

  return {
    sendUserInvitationToJoinOrganization: ({ to, orgName, invitationId }) =>
      mailer.send({
        to,
        subject: t("emails", "Invitation to join {{orgName}}", { orgName }),
        html: renderInvitationEmail({ orgName, invitationId, appBaseUrl }, t),
      }),

    sendUserResetPassword: ({ to, token }) =>
      mailer.send({
        to: to,
        subject: t("emails", "Reset your Echo password"),
        html: renderResetPasswordEmail({ email: to, appBaseUrl, token }, t),
      }),
  };
};
```

- [ ] **Step 5: Rewrite the infrastructure barrel**

Replace `packages/modules/src/notification/infrastructure/index.ts` with:

```ts
export type { MailerPort, SendMailOptions, MailerConfig } from "./mailer.port.js";
export { makeMailer } from "./mailer.nodemailer.js";

export type { EmailNotifierPort } from "./email-notifier.port.js";
export { makeEmailNotifierRepo } from "./email-notifier.js";

export { renderInvitationEmail, renderResetPasswordEmail } from "./templates/index.js";
```

- [ ] **Step 6: Create the `app/` placeholder**

`packages/modules/src/notification/app/index.ts`:

```ts
// Notification use-cases are triggered as side effects in other use-cases
export {};
```

- [ ] **Step 7: Delete the old `use-cases/` folder**

```bash
rm -rf packages/modules/src/notification/use-cases
```

- [ ] **Step 8: Update the package exports map**

In `packages/modules/package.json`, replace:

```json
    "./notification/use-cases": {
      "types": "./src/notification/use-cases/index.ts",
      "default": "./src/notification/use-cases/index.ts"
    }
```

with:

```json
    "./notification/app": {
      "types": "./src/notification/app/index.ts",
      "default": "./src/notification/app/index.ts"
    }
```

- [ ] **Step 9: Typecheck**

Run: `pnpm --filter @echo/modules typecheck && pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add packages/modules/src/notification packages/modules/package.json
git commit -m "refactor(notification): split module into port/adapter files"
```

---

## Task 12: Full-repo verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Confirm `apps/api/src/context.ts` has no remaining `{ db }` constructor args**

Run: `grep -n "Repo({ db })" apps/api/src/context.ts`
Expected: no matches (every repo factory call in `context.ts` should now be either `makeXRepo()` with no args, or `makeXRepo({ auth, ... })` / `makeXRepo({ mailer, ... })` without `db`).

- [ ] **Step 2: Confirm no leftover `use-cases` references**

Run: `grep -rn "use-cases" packages/modules/package.json apps/api/src`
Expected: no matches.

- [ ] **Step 3: Full typecheck**

Run: `pnpm typecheck`
Expected: all packages pass with no errors.

- [ ] **Step 4: Full build**

Run: `pnpm build`
Expected: all packages/apps build successfully.

- [ ] **Step 5: Run the existing test suite**

Run: `pnpm test`
Expected: all existing tests (there are none under `packages/modules` today, but `apps/api`/`apps/web` may have some) pass unchanged.

- [ ] **Step 6: Manual smoke check (optional but recommended)**

Run: `pnpm dev:api` and, from another terminal, exercise a couple of endpoints that changed the most call sites, e.g.:

```bash
curl -s http://localhost:3000/trpc/health.health
```

Expected: `{"result":{"data":{"status":"ok","db":true}}}` (or `degraded` if the DB isn't running locally).

- [ ] **Step 7: Commit (only if any stray fixups were needed)**

```bash
git add -A
git commit -m "chore: verify full build after packages/modules restructure"
```

(Skip this step if there was nothing left to fix — the preceding 11 tasks should already have committed everything.)

---

## Task 13: Update `AGENTS.md` documentation

The "Domain layer" and "Application layer" sections currently describe standalone `/packages/domain` and `/packages/app` packages that don't exist in this repo — the real domain/app code lives nested inside `packages/modules/src/<name>/{domain,app,infrastructure}`. Correct this, and document the new `db: KyselyDB` transaction convention.

**Files:**
- Modify: `AGENTS.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Fix the Monorepo structure bullet list**

In `AGENTS.md`, under `## Monorepo structure`, replace:

```markdown
- `/packages/domain` – Pure domain model (DDD + functional).
- `/packages/app` – Application services (use cases) and ports.
```

with:

```markdown
- `/packages/modules` – Business modules (DDD + functional). Each module under `src/<name>/` has its own `domain/` (pure model), `app/` (use cases, one file per use case), and `infrastructure/` (port + adapter, one pair of files per repository/service).
```

- [ ] **Step 2: Fix the "Domain layer" section**

Replace:

```markdown
### Domain layer (`/packages/domain`)
```

with:

```markdown
### Domain layer (`packages/modules/src/<name>/domain`)
```

(leave the bullet content below the heading as-is — the rules about purity, no framework imports, and determinism still apply verbatim).

- [ ] **Step 3: Fix the "Application layer" section**

Replace the entire `### Application layer (`/packages/app`)` section with:

```markdown
### Application layer (`packages/modules/src/<name>/app`)

- Contains **use cases**, one per file, named after the use case (e.g. `create-track.ts` exports `createTrack`). A barrel `app/index.ts` re-exports every use case.
- Use cases are plain async functions — not curried factories: `export async function createTrack(deps, input) { ... }`.
- `deps` always includes `db: KyselyDB` alongside the repo ports the use case needs; `input` is the use-case's own parameters.
- Ports are defined in the module's `infrastructure/*.port.ts` files. Every port method that touches the database takes `db: KyselyDB` as its first parameter — repo factories (`makeXRepo()`) hold no `db` reference themselves, so the same repo instance can be called with either the ambient connection or an open transaction.
- To make multiple repository calls atomic, a use case opens a transaction and passes the transaction handle into each port call instead of `deps.db`:

```ts
export async function someUseCase(
  deps: { db: KyselyDB; repoA: APort; repoB: BPort },
  input: Input,
) {
  return deps.db.transaction().execute(async (trx) => {
    await deps.repoA.method(trx, ...);
    await deps.repoB.method(trx, ...);
  });
}
```

Rules for agents:

- Define all external dependencies as **ports** (interfaces or function types) in `infrastructure/*.port.ts`.
- Never reference concrete Fastify routes, PostgreSQL drivers/ORMs, or tRPC server details here.
- Prefer factories (`makeXRepo(nonDbDeps)`) instead of classes for adapters; wiring is done at the edges (`apps/api/src/context.ts` and the tRPC router).
- Only wrap multiple port calls in `db.transaction()` when the use case genuinely needs cross-repository atomicity — a single repo call needs no explicit transaction.
```

- [ ] **Step 4: Add a transaction convention note to the PostgreSQL persistence section**

In `AGENTS.md`, under `## PostgreSQL persistence`, after the existing "Rules for agents" bullet list, add:

```markdown
- Repository port methods take `db: KyselyDB` as their first parameter (not baked into the adapter at construction). This lets a use case pass either the ambient connection or an open transaction (`db.transaction().execute(async (trx) => ...)`) to compose atomic operations across repositories.
```

- [ ] **Step 5: Verify the doc renders sensibly**

Run: `grep -n "packages/domain\|packages/app" AGENTS.md`
Expected: no remaining references to standalone `/packages/domain` or `/packages/app` (aside from the Dependency rules section, which is out of scope for this change and may be revisited separately).

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md
git commit -m "docs: correct AGENTS.md to describe packages/modules layout and db transaction convention"
```
