import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort, AudioClip, FileType } from "@echo/app";

export const makeAudioClipRepo = ({
  db,
}: {
  db: KyselyDB;
}): AudioClipRepoPort => ({
  list: async ({ trackId }) => {
    const rows = await db
      .selectFrom("audioClip")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select([
        "audioClip.id",
        "audioClip.trackId",
        "audioClip.fileId",
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

  listBySong: async ({ songId }) => {
    const rows = await db
      .selectFrom("audioClip")
      .innerJoin("track", "track.id", "audioClip.trackId")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select([
        "audioClip.id",
        "audioClip.trackId",
        "audioClip.fileId",
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

  findById: async ({ clipId }) => {
    const row = await db
      .selectFrom("audioClip")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select([
        "audioClip.id",
        "audioClip.trackId",
        "audioClip.fileId",
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

  create: async ({ id, trackId, fileId, durationMs, startMeasure }) => {
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

  updatePosition: async ({ clipId, startMeasure }) => {
    await db
      .updateTable("audioClip")
      .set({ startMeasure })
      .where("id", "=", clipId)
      .execute();
    const row = await db
      .selectFrom("audioClip")
      .innerJoin("file", "file.id", "audioClip.fileId")
      .select([
        "audioClip.id",
        "audioClip.trackId",
        "audioClip.fileId",
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

  delete: async ({ clipId }) => {
    await db.deleteFrom("audioClip").where("id", "=", clipId).execute();
  },
});

function toAudioClip(row: {
  id: string;
  trackId: string;
  fileId: string;
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
