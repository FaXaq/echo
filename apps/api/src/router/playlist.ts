import { z } from "zod";
import { organizationProcedure, router } from "../trpc";
import {
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  listPlaylists,
  listPlaylistSongs,
  addSongToPlaylist,
  removeSongFromPlaylist,
  attachPlaylistToEvent,
  detachPlaylistFromEvent,
  listEventPlaylists,
  searchPlaylists,
} from "@echo/modules/playlist/app";
import {
  insertPlaylistCommandFactory,
  deletePlaylistCommandFactory,
  getPlaylistByIdQueryFactory,
  listPlaylistsQueryFactory,
  listPlaylistSongsQueryFactory,
  addSongToPlaylistCommandFactory,
  removeSongFromPlaylistCommandFactory,
  attachPlaylistToEventCommandFactory,
  detachPlaylistFromEventCommandFactory,
  listEventPlaylistsQueryFactory,
  searchPlaylistsQueryFactory,
} from "@echo/modules/playlist/infrastructure";

const insertPlaylistCommand = insertPlaylistCommandFactory();
const deletePlaylistCommand = deletePlaylistCommandFactory();
const getPlaylistByIdQuery = getPlaylistByIdQueryFactory();
const listPlaylistsQuery = listPlaylistsQueryFactory();
const listPlaylistSongsQuery = listPlaylistSongsQueryFactory();
const addSongToPlaylistCommand = addSongToPlaylistCommandFactory();
const removeSongFromPlaylistCommand = removeSongFromPlaylistCommandFactory();
const attachPlaylistToEventCommand = attachPlaylistToEventCommandFactory();
const detachPlaylistFromEventCommand = detachPlaylistFromEventCommandFactory();
const listEventPlaylistsQuery = listEventPlaylistsQueryFactory();
const searchPlaylistsQuery = searchPlaylistsQueryFactory();

export const makePlaylistRouter = () =>
  router({
    getPlaylistById: organizationProcedure
      .input(z.object({ playlistId: z.string() }))
      .query(({ ctx, input }) =>
        getPlaylistById(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            getPlaylistByIdQuery,
          },
          { scope: ctx.organizationScope, playlistId: input.playlistId },
        ),
      ),

    listPlaylists: organizationProcedure.query(({ ctx }) =>
      listPlaylists(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          listPlaylistsQuery,
        },
        { scope: ctx.organizationScope },
      ),
    ),

    createPlaylist: organizationProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
        }),
      )
      .mutation(({ ctx, input }) =>
        createPlaylist(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            insertPlaylistCommand,
          },
          {
            scope: ctx.organizationScope,
            userId: ctx.session.user.id,
            title: input.title,
            description: input.description ?? null,
          },
        ),
      ),

    deletePlaylist: organizationProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        deletePlaylist(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            deletePlaylistCommand,
          },
          { id: input.id, scope: ctx.organizationScope },
        ),
      ),

    listPlaylistSongs: organizationProcedure
      .input(z.object({ playlistId: z.string() }))
      .query(({ ctx, input }) =>
        listPlaylistSongs(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listPlaylistSongsQuery,
          },
          { playlistId: input.playlistId, scope: ctx.organizationScope },
        ),
      ),

    addSongToPlaylist: organizationProcedure
      .input(z.object({ playlistId: z.string(), songId: z.string() }))
      .mutation(({ ctx, input }) =>
        addSongToPlaylist(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            addSongToPlaylistCommand,
          },
          { playlistId: input.playlistId, songId: input.songId, scope: ctx.organizationScope },
        ),
      ),

    removeSongFromPlaylist: organizationProcedure
      .input(z.object({ playlistId: z.string(), songId: z.string() }))
      .mutation(({ ctx, input }) =>
        removeSongFromPlaylist(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            removeSongFromPlaylistCommand,
          },
          { playlistId: input.playlistId, songId: input.songId, scope: ctx.organizationScope },
        ),
      ),

    listEventPlaylists: organizationProcedure
      .input(z.object({ eventId: z.string() }))
      .query(({ ctx, input }) =>
        listEventPlaylists(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listEventPlaylistsQuery,
          },
          { eventId: input.eventId, scope: ctx.organizationScope },
        ),
      ),

    attachPlaylistToEvent: organizationProcedure
      .input(z.object({ playlistId: z.string(), eventId: z.string() }))
      .mutation(({ ctx, input }) =>
        attachPlaylistToEvent(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            attachPlaylistToEventCommand,
          },
          { playlistId: input.playlistId, eventId: input.eventId, scope: ctx.organizationScope },
        ),
      ),

    detachPlaylistFromEvent: organizationProcedure
      .input(z.object({ playlistId: z.string(), eventId: z.string() }))
      .mutation(({ ctx, input }) =>
        detachPlaylistFromEvent(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            detachPlaylistFromEventCommand,
          },
          { playlistId: input.playlistId, eventId: input.eventId, scope: ctx.organizationScope },
        ),
      ),

    searchPlaylists: organizationProcedure
      .input(z.object({ query: z.string().trim().min(1) }))
      .query(({ ctx, input }) =>
        searchPlaylists(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            searchPlaylistsQuery,
          },
          { query: input.query, scope: ctx.organizationScope },
        ),
      ),
  });
