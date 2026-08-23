export type { InsertSongInput, InsertSongCommandPort } from "./insert-song.command.port.js";
export { insertSongCommandFactory } from "./insert-song.command.kysely.js";

export type { UpdateSongInput, UpdateSongCommandPort } from "./update-song.command.port.js";
export { updateSongCommandFactory } from "./update-song.command.kysely.js";

export type {
  UpdateSongLyricsInput,
  UpdateSongLyricsCommandPort,
} from "./update-song-lyrics.command.port.js";
export { updateSongLyricsCommandFactory } from "./update-song-lyrics.command.kysely.js";

export type { DeleteSongInput, DeleteSongCommandPort } from "./delete-song.command.port.js";
export { deleteSongCommandFactory } from "./delete-song.command.kysely.js";

export type { GetSongByIdQueryInput, GetSongByIdQueryPort } from "./get-song-by-id.query.port.js";
export { getSongByIdQueryFactory } from "./get-song-by-id.query.kysely.js";

export type { ListSongsQueryPort } from "./list-songs.query.port.js";
export { listSongsQueryFactory } from "./list-songs.query.kysely.js";
