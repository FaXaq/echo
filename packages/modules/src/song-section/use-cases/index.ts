import type {
  SongSectionDefinitionRepoPort,
  SongSectionInstanceRepoPort,
  SongChord,
} from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

// ── Definition use cases ───────────────────────────���────────────────────────

export const makeCreateSectionDefinition =
  (deps: { definitionRepo: SongSectionDefinitionRepoPort }) =>
  async (input: {
    songId: string;
    name: string;
    chords?: SongChord[];
    lyrics?: string | null;
    color?: string | null;
  }) => {
    return deps.definitionRepo.create({
      id: crypto.randomUUID(),
      songId: input.songId,
      name: input.name,
      chords: input.chords ?? [],
      lyrics: input.lyrics ?? null,
      color: input.color ?? null,
    });
  };

export const makeUpdateSectionDefinition =
  (deps: { definitionRepo: SongSectionDefinitionRepoPort }) =>
  async (input: {
    id: string;
    name?: string;
    chords?: SongChord[];
    lyrics?: string | null;
    color?: string | null;
  }) => {
    const existing = await deps.definitionRepo.get({ id: input.id });
    if (!existing) throw notFound("SongSectionDefinition");
    return deps.definitionRepo.update(input);
  };

export const makeDeleteSectionDefinition =
  (deps: { definitionRepo: SongSectionDefinitionRepoPort }) =>
  async (input: { id: string }) => {
    const existing = await deps.definitionRepo.get({ id: input.id });
    if (!existing) throw notFound("SongSectionDefinition");
    await deps.definitionRepo.delete({ id: input.id });
  };

export const makeListSectionDefinitions =
  (deps: { definitionRepo: SongSectionDefinitionRepoPort }) =>
  async (input: { songId: string }) => {
    return deps.definitionRepo.list({ songId: input.songId });
  };

// ── Instance use cases ──────────────────────────────────────────────────────

export const makeCreateSectionInstance =
  (deps: {
    instanceRepo: SongSectionInstanceRepoPort;
    definitionRepo: SongSectionDefinitionRepoPort;
  }) =>
  async (input: {
    songId: string;
    definitionId: string;
    lyricsOverride?: string | null;
    lengthMeasures?: number;
  }) => {
    const definition = await deps.definitionRepo.get({ id: input.definitionId });
    if (!definition) throw notFound("SongSectionDefinition");

    const lengthMeasures = input.lengthMeasures ?? 8;
    const last = await deps.instanceRepo.getLastStartMeasure({ songId: input.songId });
    const startMeasure = last ? last.startMeasure + last.lengthMeasures : 1;

    return deps.instanceRepo.create({
      id: crypto.randomUUID(),
      songId: input.songId,
      definitionId: input.definitionId,
      startMeasure,
      lengthMeasures,
      lyricsOverride: input.lyricsOverride ?? null,
    });
  };

export const makeUpdateSectionInstance =
  (deps: { instanceRepo: SongSectionInstanceRepoPort }) =>
  async (input: {
    id: string;
    startMeasure?: number;
    lengthMeasures?: number;
    lyricsOverride?: string | null;
  }) => {
    const existing = await deps.instanceRepo.get({ id: input.id });
    if (!existing) throw notFound("SongSectionInstance");
    return deps.instanceRepo.update(input);
  };

export const makeDeleteSectionInstance =
  (deps: { instanceRepo: SongSectionInstanceRepoPort }) =>
  async (input: { id: string }) => {
    const existing = await deps.instanceRepo.get({ id: input.id });
    if (!existing) throw notFound("SongSectionInstance");
    await deps.instanceRepo.delete({ id: input.id });
  };

export const makeListSectionInstances =
  (deps: { instanceRepo: SongSectionInstanceRepoPort }) =>
  async (input: { songId: string }) => {
    return deps.instanceRepo.list({ songId: input.songId });
  };

export const makeReorderSectionInstances =
  (deps: { instanceRepo: SongSectionInstanceRepoPort }) =>
  async (input: { songId: string; orderedIds: string[] }) => {
    const instances = await deps.instanceRepo.list({ songId: input.songId });
    const instanceMap = new Map(instances.map(i => [i.id, i]));

    const updates = input.orderedIds.map((id, index) => {
      const instance = instanceMap.get(id);
      if (!instance) throw notFound("SongSectionInstance");
      const startMeasure = 1 + index * instance.lengthMeasures;
      return { id, startMeasure };
    });

    await deps.instanceRepo.updateStartMeasures({ updates });
    return deps.instanceRepo.list({ songId: input.songId });
  };
