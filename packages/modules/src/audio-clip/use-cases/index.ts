import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort, AudioClip } from "../infrastructure/index.js";
import type { TrackRepoPort } from "../../track/infrastructure/index.js";
import type { FileRepoPort } from "../../file/infrastructure/index.js";
import type { FileStoragePort } from "../../file/infrastructure/index.js";
import { notFound, conflict } from "@echo/errors";

export const makeListAudioClips =
  (deps: { audioClipRepo: AudioClipRepoPort }) =>
  async (input: { songId: string }) => {
    return deps.audioClipRepo.listBySong({ songId: input.songId });
  };

export const makeGetUploadUrl =
  (deps: { fileStorage: FileStoragePort }) =>
  async (input: { filename: string; contentType: string; organizationId: string }) => {
    const fileId = crypto.randomUUID();
    const storageKey = `${input.organizationId}/audio-clips/${fileId}-${input.filename}`;
    const uploadUrl = await deps.fileStorage.getUploadUrl({
      key: storageKey,
      contentType: input.contentType,
    });
    return { storageKey, uploadUrl };
  };

export const makeRegisterAudioClip =
  (deps: { audioClipRepo: AudioClipRepoPort; fileRepo: FileRepoPort; db: KyselyDB }) =>
  async (input: {
    trackId: string;
    filename: string;
    storageKey: string;
    organizationId: string;
    startMeasure: number;
    durationMs?: number | null;
  }) => {
    const fileId = crypto.randomUUID();
    await deps.fileRepo.create(deps.db, {
      id: fileId,
      storageKey: input.storageKey,
      filename: input.filename,
      type: "audio",
      organizationId: input.organizationId,
    });
    return deps.audioClipRepo.create({
      id: crypto.randomUUID(),
      trackId: input.trackId,
      fileId,
      durationMs: input.durationMs,
      startMeasure: input.startMeasure,
    });
  };

export const makeUpdateAudioClipPosition =
  (deps: { audioClipRepo: AudioClipRepoPort; trackRepo: TrackRepoPort; db: KyselyDB }) =>
  async (input: { clipId: string; startMeasure: number; trackId?: string }) => {
    if (input.trackId !== undefined) {
      const clip = await deps.audioClipRepo.findById({ clipId: input.clipId });
      if (!clip) {
        throw notFound("AudioClip");
      }

      const currentTrack = await deps.trackRepo.findById(deps.db, {
        trackId: clip.trackId,
      });
      if (!currentTrack) {
        throw notFound("Track");
      }

      const targetTrack = await deps.trackRepo.findById(deps.db, {
        trackId: input.trackId,
      });
      if (!targetTrack) {
        throw notFound("Track");
      }

      if (currentTrack.songId !== targetTrack.songId) {
        throw conflict("Target track does not belong to the same song");
      }
    }

    return deps.audioClipRepo.updatePosition({
      clipId: input.clipId,
      startMeasure: input.startMeasure,
      trackId: input.trackId,
    });
  };

export const makeDeleteAudioClip =
  (deps: { audioClipRepo: AudioClipRepoPort; fileStorage: FileStoragePort }) =>
  async (input: { clipId: string }) => {
    const clip = await deps.audioClipRepo.findById({ clipId: input.clipId });
    if (!clip) throw notFound("AudioClip");
    await deps.audioClipRepo.delete({ clipId: input.clipId });
    await deps.fileStorage.deleteFile({ key: clip.file.storageKey });
  };

export const makeDeleteManyAudioClips =
  (deps: { audioClipRepo: AudioClipRepoPort; fileStorage: FileStoragePort }) =>
  async (input: { clipIds: string[] }) => {
    if (input.clipIds.length === 0) return;
    const deleted = await deps.audioClipRepo.deleteMany({ clipIds: input.clipIds });
    await Promise.allSettled(
      deleted.map(({ storageKey }) => deps.fileStorage.deleteFile({ key: storageKey })),
    );
  };

export const makeGetSignedUrls =
  (deps: { fileStorage: FileStoragePort }) =>
  async (input: { storageKeys: string[] }) => {
    return Promise.all(
      input.storageKeys.map(async (key) => ({
        key,
        url: await deps.fileStorage.getDownloadUrl({ key }),
      })),
    );
  };

export const makeRenameAudioClip =
  (deps: { audioClipRepo: AudioClipRepoPort }) =>
  async (input: { clipId: string; name: string }): Promise<AudioClip> =>
    deps.audioClipRepo.rename(input);
