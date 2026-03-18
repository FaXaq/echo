import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort, MidiClip, FileType } from "@echo/app";

export const makeMidiClipRepo = ({
  db,
}: {
  db: KyselyDB;
}): MidiClipRepoPort => ({
  listBySong: async ({ songId }) => {
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

  findById: async ({ clipId }) => {
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

  create: async ({ id, trackId, fileId, startMeasure, durationMs }) => {
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

  updatePosition: async ({ clipId, startMeasure, trackId }) => {
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

  rename: async ({ clipId, name }) => {
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

  delete: async ({ clipId }) => {
    await db.deleteFrom("midiClip").where("id", "=", clipId).execute();
  },

  deleteMany: async ({ clipIds }) => {
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
