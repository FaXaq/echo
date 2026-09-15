import { z } from "zod";
import { organizationProcedure, router } from "../trpc";
import {
  createSong,
  listSongs,
  updateSong,
  updateSongLyrics,
  deleteSong,
  getSongById,
  searchSongs,
  setSongAudioVersion,
  clearSongAudioVersion,
  listSongAudioVersions,
} from "@echo/modules/song/app";
import { songTypeSchema } from "@echo/modules/song/domain";
import {
  insertSongCommandFactory,
  updateSongCommandFactory,
  updateSongLyricsCommandFactory,
  deleteSongCommandFactory,
  listSongsQueryFactory,
  getSongByIdQueryFactory,
  searchSongsQueryFactory,
} from "@echo/modules/song/infrastructure";
import {
  findOrphanedFilesForSongQueryFactory,
  deleteFileByIdCommandFactory,
  findFileByIdQueryFactory,
  setSongFileRoleCommandFactory,
  clearSongFileRoleCommandFactory,
  listSongAudioVersionsQueryFactory,
} from "@echo/modules/drive/infrastructure";

const songInput = {
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional(),
  bpm: z.number().int().positive().optional(),
  key: z.string().optional(),
  type: songTypeSchema.nullable().optional(),
};

const insertSongCommand = insertSongCommandFactory();
const updateSongCommand = updateSongCommandFactory();
const updateSongLyricsCommand = updateSongLyricsCommandFactory();
const deleteSongCommand = deleteSongCommandFactory();
const listSongsQuery = listSongsQueryFactory();
const getSongByIdQuery = getSongByIdQueryFactory();
const findOrphanedFilesForSongQuery = findOrphanedFilesForSongQueryFactory();
const deleteFileByIdCommand = deleteFileByIdCommandFactory();
const searchSongsQuery = searchSongsQueryFactory();
const findFileByIdQuery = findFileByIdQueryFactory();
const setSongFileRoleCommand = setSongFileRoleCommandFactory();
const clearSongFileRoleCommand = clearSongFileRoleCommandFactory();
const listSongAudioVersionsQuery = listSongAudioVersionsQueryFactory();

export const makeSongRouter = () =>
  router({
    getSongById: organizationProcedure
      .input(z.object({ songId: z.string() }))
      .query(({ ctx, input }) =>
        getSongById(
          { db: ctx.db, getSongByIdQuery },
          { scope: ctx.organizationScope, songId: input.songId },
        ),
      ),

    listSongs: organizationProcedure.query(({ ctx }) =>
      listSongs({ db: ctx.db, listSongsQuery }, { scope: ctx.organizationScope }),
    ),

    searchSongs: organizationProcedure
      .input(z.object({ query: z.string().trim().min(1) }))
      .query(({ ctx, input }) =>
        searchSongs(
          { db: ctx.db, searchSongsQuery },
          { scope: ctx.organizationScope, query: input.query },
        ),
      ),

    createSong: organizationProcedure
      .input(z.object(songInput))
      .mutation(({ ctx, input }) =>
        createSong(
          { db: ctx.db, insertSongCommand },
          { ...input, scope: ctx.organizationScope, userId: ctx.session.user.id },
        ),
      ),

    updateSong: organizationProcedure
      .input(z.object({ id: z.string(), ...songInput }))
      .mutation(({ ctx, input }) =>
        updateSong(
          { db: ctx.db, updateSongCommand },
          { ...input, scope: ctx.organizationScope, userId: ctx.session.user.id },
        ),
      ),

    updateSongLyrics: organizationProcedure
      .input(z.object({ id: z.string(), lyrics: z.string().nullable() }))
      .mutation(({ ctx, input }) =>
        updateSongLyrics(
          { db: ctx.db, updateSongLyricsCommand },
          {
            id: input.id,
            scope: ctx.organizationScope,
            userId: ctx.session.user.id,
            lyrics: input.lyrics,
          },
        ),
      ),

    deleteSong: organizationProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const failures = await deleteSong(
          {
            db: ctx.db,
            deleteSongCommand,
            findOrphanedFilesForSongQuery,
            deleteFileByIdCommand,
            s3Storage: ctx.s3Storage,
          },
          { id: input.id, scope: ctx.organizationScope },
        );
        for (const failure of failures) {
          ctx.logger.error(
            { error: failure.error, fileId: failure.fileId, songId: input.id },
            "Failed to delete S3 object during song deletion",
          );
        }
      }),

    getAudioVersions: organizationProcedure
      .input(z.object({ songId: z.string() }))
      .query(({ ctx, input }) =>
        listSongAudioVersions(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            s3Storage: ctx.s3Storage,
            listSongAudioVersionsQuery,
          },
          { songId: input.songId, scope: ctx.organizationScope },
        ),
      ),

    setAudioVersion: organizationProcedure
      .input(z.object({ songId: z.string(), fileId: z.string(), role: z.enum(["demo", "final"]) }))
      .mutation(({ ctx, input }) =>
        setSongAudioVersion(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFileByIdQuery,
            setSongFileRoleCommand,
          },
          { ...input, userId: ctx.session.user.id, scope: ctx.organizationScope },
        ),
      ),

    clearAudioVersion: organizationProcedure
      .input(z.object({ songId: z.string(), fileId: z.string() }))
      .mutation(({ ctx, input }) =>
        clearSongAudioVersion(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            clearSongFileRoleCommand,
          },
          { ...input, scope: ctx.organizationScope },
        ),
      ),
  });
