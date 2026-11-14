import { z } from "zod";
import {
  confirmUpload,
  createFolder,
  createUpload,
  deleteFolder,
  getFileDownloadUrl,
  getFilesDownloadUrls,
  addOccurrences,
  getFolder,
  listFileOccurrences,
  removeOccurrence,
  listEventFiles,
  listFolderContents,
  listOrganizationFiles,
  listSongFiles,
  moveFile,
  moveFolder,
  renameFile,
  renameFolder,
  searchDrive,
  listRecentFiles,
  listRecentMedia,
} from "@echo/modules/drive/app";
import { MAX_THUMBNAIL_BYTES } from "@echo/modules/drive/domain";
import {
  deleteFolderCascadeCommandFactory,
  deleteOccurrenceCommandFactory,
  deleteOrphanedFilesCommandFactory,
  eventExistsInOrganizationQueryFactory,
  findFileByIdQueryFactory,
  findFilesByIdsQueryFactory,
  findFolderByIdQueryFactory,
  findFolderByParentAndNameQueryFactory,
  findFolderDescendantIdsQueryFactory,
  insertFolderCommandFactory,
  insertOccurrencesCommandFactory,
  insertPendingFileCommandFactory,
  listFileOccurrencesQueryFactory,
  listFilesByEventQueryFactory,
  listFilesByOrganizationQueryFactory,
  listFilesBySongQueryFactory,
  listFolderContentsQueryFactory,
  markFileUploadedCommandFactory,
  moveFileToFolderCommandFactory,
  moveFolderCommandFactory,
  renameFileByIdCommandFactory,
  renameFolderByIdCommandFactory,
  searchDriveQueryFactory,
  songExistsInOrganizationQueryFactory,
  listRecentFilesQueryFactory,
} from "@echo/modules/drive/infrastructure";
import { getPersonalOrganizationQuery } from "@echo/modules/organization/infrastructure";
import { resolveEntitlements } from "@echo/modules/plan/app";
import {
  getOrganizationStorageUsageQueryFactory,
  resolvePlanQueryFactory,
} from "@echo/modules/plan/infrastructure";
import { organizationProcedure, router } from "../trpc";

const driveSortFieldSchema = z.enum(["name", "event", "updatedAt", "sizeBytes"]);
const driveSortOrderSchema = z.enum(["asc", "desc"]);
const placeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("root") }),
  z.object({ kind: z.literal("folder"), id: z.string() }),
  z.object({ kind: z.literal("event"), id: z.string() }),
  z.object({ kind: z.literal("song"), id: z.string() }),
]);

const insertPendingFileCommand = insertPendingFileCommandFactory();
const songExistsInOrganizationQuery = songExistsInOrganizationQueryFactory();
const eventExistsInOrganizationQuery = eventExistsInOrganizationQueryFactory();
const findFileByIdQuery = findFileByIdQueryFactory();
const findFilesByIdsQuery = findFilesByIdsQueryFactory();
const markFileUploadedCommand = markFileUploadedCommandFactory();
const listFilesByEventQuery = listFilesByEventQueryFactory();
const listFilesBySongQuery = listFilesBySongQueryFactory();
const listFilesByOrganizationQuery = listFilesByOrganizationQueryFactory();
const renameFileByIdCommand = renameFileByIdCommandFactory();
const moveFileToFolderCommand = moveFileToFolderCommandFactory();
const findFolderByIdQuery = findFolderByIdQueryFactory();
const findFolderByParentAndNameQuery = findFolderByParentAndNameQueryFactory();
const insertFolderCommand = insertFolderCommandFactory();
const renameFolderByIdCommand = renameFolderByIdCommandFactory();
const moveFolderCommand = moveFolderCommandFactory();
const findFolderDescendantIdsQuery = findFolderDescendantIdsQueryFactory();
const deleteFolderCascadeCommand = deleteFolderCascadeCommandFactory();
const deleteOrphanedFilesCommand = deleteOrphanedFilesCommandFactory();
const insertOccurrencesCommand = insertOccurrencesCommandFactory();
const deleteOccurrenceCommand = deleteOccurrenceCommandFactory();
const listFileOccurrencesQuery = listFileOccurrencesQueryFactory();
const listFolderContentsQuery = listFolderContentsQueryFactory();
const searchDriveQuery = searchDriveQueryFactory();
const resolvePlanQuery = resolvePlanQueryFactory();
const getOrganizationStorageUsageQuery = getOrganizationStorageUsageQueryFactory();

const listRecentFilesQuery = listRecentFilesQueryFactory();

export const makeDriveRouter = () =>
  router({
    listRecentFiles: organizationProcedure
      .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }))
      .query(({ ctx, input }) =>
        listRecentFiles(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listRecentFilesQuery,
          },
          { scope: ctx.organizationScope, limit: input.limit },
        ),
      ),

    listRecentMedia: organizationProcedure
      .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }))
      .query(({ ctx, input }) =>
        listRecentMedia(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listRecentFilesQuery,
          },
          { scope: ctx.organizationScope, limit: input.limit },
        ),
      ),

    createUpload: organizationProcedure
      .input(
        z.object({
          place: placeSchema,
          mimeType: z.string().min(1),
          sizeBytes: z.number().int().positive(),
          durationSeconds: z.number().int().nonnegative().nullish(),
          width: z.number().int().positive().nullish(),
          height: z.number().int().positive().nullish(),
          filename: z.string().min(1),
          previewSizeBytes: z.number().int().positive().optional(),
          thumbnailSizeBytes: z.number().int().positive().max(MAX_THUMBNAIL_BYTES).optional(),
        }),
      )
      .mutation(({ ctx, input }) =>
        createUpload(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermission: ctx.userHasPermission,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFolderByIdQuery,
            insertPendingFileCommand,
            eventExistsInOrganizationQuery,
            songExistsInOrganizationQuery,
            getPersonalOrganizationId: async (userId: string) =>
              (await getPersonalOrganizationQuery(ctx.db, userId))?.id,
            resolveOrganizationEntitlements: (db, scope) =>
              resolveEntitlements({ resolvePlanQuery }, { db, scope }),
            getOrganizationStorageUsage: getOrganizationStorageUsageQuery,
          },
          { userId: ctx.session.user.id, scope: ctx.organizationScope, ...input },
        ),
      ),

    confirmUpload: organizationProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        confirmUpload(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            findFileByIdQuery,
            markFileUploadedCommand,
          },
          { id: input.id, scope: ctx.organizationScope },
        ),
      ),

    listEventFiles: organizationProcedure
      .input(z.object({ eventId: z.string() }))
      .query(({ ctx, input }) =>
        listEventFiles(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            s3Storage: ctx.s3Storage,
            listFilesByEventQuery,
          },
          { eventId: input.eventId, scope: ctx.organizationScope },
        ),
      ),

    listSongFiles: organizationProcedure
      .input(z.object({ songId: z.string() }))
      .query(({ ctx, input }) =>
        listSongFiles(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            s3Storage: ctx.s3Storage,
            listFilesBySongQuery,
          },
          { songId: input.songId, scope: ctx.organizationScope },
        ),
      ),

    listOrganizationFiles: organizationProcedure.query(({ ctx }) =>
      listOrganizationFiles(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          listFilesByOrganizationQuery,
        },
        { scope: ctx.organizationScope },
      ),
    ),

    searchDrive: organizationProcedure
      .input(z.object({ query: z.string().trim().min(1) }))
      .query(({ ctx, input }) =>
        searchDrive(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            searchDriveQuery,
          },
          { scope: ctx.organizationScope, query: input.query },
        ),
      ),

    renameFile: organizationProcedure
      .input(z.object({ id: z.string(), filename: z.string().min(1) }))
      .mutation(({ ctx, input }) =>
        renameFile(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            renameFileByIdCommand,
          },
          { id: input.id, scope: ctx.organizationScope, filename: input.filename },
        ),
      ),

    getFileDownloadUrl: organizationProcedure
      .input(z.object({ id: z.string(), download: z.boolean().optional() }))
      .query(({ ctx, input }) =>
        getFileDownloadUrl(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFileByIdQuery,
          },
          { id: input.id, scope: ctx.organizationScope, download: input.download },
        ),
      ),

    getFilesDownloadUrls: organizationProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(({ ctx, input }) =>
        getFilesDownloadUrls(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFilesByIdsQuery,
          },
          { ids: input.ids, scope: ctx.organizationScope },
        ),
      ),

    moveFile: organizationProcedure
      .input(
        z.object({
          id: z.string(),
          from: z.discriminatedUnion("kind", [
            z.object({ kind: z.literal("root") }),
            z.object({ kind: z.literal("folder"), id: z.string() }),
          ]),
          folderId: z.string().nullable(),
        }),
      )
      .mutation(({ ctx, input }) =>
        moveFile(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFolderByIdQuery,
            moveFileToFolderCommand,
          },
          {
            id: input.id,
            from: input.from,
            scope: ctx.organizationScope,
            folderId: input.folderId,
          },
        ),
      ),

    addOccurrences: organizationProcedure
      .input(z.object({ fileIds: z.array(z.string()).min(1), place: placeSchema }))
      .mutation(({ ctx, input }) =>
        addOccurrences(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFilesByIdsQuery,
            findFolderByIdQuery,
            eventExistsInOrganizationQuery,
            songExistsInOrganizationQuery,
            insertOccurrencesCommand,
          },
          { ...input, userId: ctx.session.user.id, scope: ctx.organizationScope },
        ),
      ),

    removeOccurrence: organizationProcedure
      .input(z.object({ fileId: z.string(), place: placeSchema }))
      .mutation(async ({ ctx, input }) => {
        const { deleted, failures } = await removeOccurrence(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            deleteOccurrenceCommand,
            deleteOrphanedFilesCommand,
          },
          { ...input, scope: ctx.organizationScope },
        );
        for (const failure of failures) {
          ctx.logger.error(
            { error: failure.error, fileId: failure.fileId },
            "Failed to delete S3 object during occurrence removal",
          );
        }
        return { deleted };
      }),

    listFileOccurrences: organizationProcedure
      .input(z.object({ fileId: z.string() }))
      .query(({ ctx, input }) =>
        listFileOccurrences(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listFileOccurrencesQuery,
          },
          { fileId: input.fileId, scope: ctx.organizationScope },
        ),
      ),

    createFolder: organizationProcedure
      .input(z.object({ parentFolderId: z.string().nullable(), name: z.string().min(1) }))
      .mutation(({ ctx, input }) =>
        createFolder(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFolderByIdQuery,
            findFolderByParentAndNameQuery,
            insertFolderCommand,
          },
          {
            scope: ctx.organizationScope,
            parentFolderId: input.parentFolderId,
            name: input.name,
          },
        ),
      ),

    renameFolder: organizationProcedure
      .input(z.object({ id: z.string(), name: z.string().min(1) }))
      .mutation(({ ctx, input }) =>
        renameFolder(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFolderByIdQuery,
            findFolderByParentAndNameQuery,
            renameFolderByIdCommand,
          },
          { id: input.id, scope: ctx.organizationScope, name: input.name },
        ),
      ),

    moveFolder: organizationProcedure
      .input(z.object({ id: z.string(), parentFolderId: z.string().nullable() }))
      .mutation(({ ctx, input }) =>
        moveFolder(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFolderByIdQuery,
            findFolderByParentAndNameQuery,
            findFolderDescendantIdsQuery,
            moveFolderCommand,
          },
          { id: input.id, scope: ctx.organizationScope, parentFolderId: input.parentFolderId },
        ),
      ),

    deleteFolder: organizationProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const failures = await deleteFolder(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            deleteFolderCascadeCommand,
            deleteOrphanedFilesCommand,
          },
          { id: input.id, scope: ctx.organizationScope },
        );
        for (const failure of failures) {
          ctx.logger.error(
            { error: failure.error, fileId: failure.fileId, folderId: input.id },
            "Failed to delete S3 object during folder deletion",
          );
        }
      }),

    listFolderContents: organizationProcedure
      .input(
        z.object({
          folderId: z.string().nullable(),
          sort: z
            .object({ field: driveSortFieldSchema, order: driveSortOrderSchema })
            .default({ field: "name", order: "asc" }),
        }),
      )
      .query(({ ctx, input }) =>
        listFolderContents(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFolderByIdQuery,
            listFolderContentsQuery,
          },
          { scope: ctx.organizationScope, folderId: input.folderId, sort: input.sort },
        ),
      ),

    getFolder: organizationProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) =>
      getFolder(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          findFolderByIdQuery,
        },
        { id: input.id, scope: ctx.organizationScope },
      ),
    ),
  });
