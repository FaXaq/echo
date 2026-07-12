export type SongSectionDefinitionId = string;
export type SongSectionInstanceId = string;

export type SongChord = {
  at: number;
  chord: string;
};

export type SongSectionDefinition = {
  id: SongSectionDefinitionId;
  songId: string;
  name: string;
  chords: SongChord[];
  lyrics: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  repeat: number;
};

export type SongSectionInstance = {
  id: SongSectionInstanceId;
  songId: string;
  definitionId: SongSectionDefinitionId;
  startMeasure: number;
  lengthMeasures: number;
  lyricsOverride: string | null;
  createdAt: Date;
  updatedAt: Date;
  repeat: number;
};

export type SongSectionInstanceWithDefinition = SongSectionInstance & {
  definition: SongSectionDefinition;
};
