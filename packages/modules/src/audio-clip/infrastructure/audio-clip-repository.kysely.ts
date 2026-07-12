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
