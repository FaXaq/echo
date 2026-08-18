import { z } from "zod";
import {
  confirmUpload,
  createFolder,
  createUpload,
  deleteFile,
  deleteFolder,
  getFileDownloadUrl,
  getFolder,
  listEventFiles,
  listFolderContents,
  listOrganizationFiles,
  moveFile,
  moveFolder,
  renameFile,
  renameFolder,
  searchDrive,
} from "@echo/modules/drive/app";
import {
  deleteFileByIdCommandFactory,
  deleteFolderCascadeCommandFactory,
  findFileByIdQueryFactory,
  findFolderByIdQueryFactory,
  findFolderByParentAndNameQueryFactory,
  findFolderDescendantIdsQueryFactory,
  insertFolderCommandFactory,
  insertPendingFileCommandFactory,
  listFilesByEventQueryFactory,
  listFilesByOrganizationQueryFactory,
  listFolderContentsQueryFactory,
  markFileUploadedCommandFactory,
  moveFileToFolderCommandFactory,
  moveFolderCommandFactory,
  renameFileByIdCommandFactory,
  renameFolderByIdCommandFactory,
  searchDriveQueryFactory,
} from "@echo/modules/drive/infrastructure";
import { getPersonalOrganizationQuery } from "@echo/modules/organization/infrastructure";
import { resolveEntitlements } from "@echo/modules/plan/app";
import {
  getOrganizationStorageUsageQuery,
  resolvePlanQuery,
} from "@echo/modules/plan/infrastructure";
import { organizationProcedure, router } from "../trpc";

const driveSortFieldSchema = z.enum(["name", "event", "updatedAt", "sizeBytes"]);
const driveSortOrderSchema = z.enum(["asc", "desc"]);

const insertPendingFileCommand = insertPendingFileCommandFactory();
const findFileByIdQuery = findFileByIdQueryFactory();
const markFileUploadedCommand = markFileUploadedCommandFactory();
const listFilesByEventQuery = listFilesByEventQueryFactory();
const listFilesByOrganizationQuery = listFilesByOrganizationQueryFactory();
const deleteFileByIdCommand = deleteFileByIdCommandFactory();
const renameFileByIdCommand = renameFileByIdCommandFactory();
const moveFileToFolderCommand = moveFileToFolderCommandFactory();
const findFolderByIdQuery = findFolderByIdQueryFactory();
const findFolderByParentAndNameQuery = findFolderByParentAndNameQueryFactory();
const insertFolderCommand = insertFolderCommandFactory();
const renameFolderByIdCommand = renameFolderByIdCommandFactory();
const moveFolderCommand = moveFolderCommandFactory();
const findFolderDescendantIdsQuery = findFolderDescendantIdsQueryFactory();
const deleteFolderCascadeCommand = deleteFolderCascadeCommandFactory();
const listFolderContentsQuery = listFolderContentsQueryFactory();
const searchDriveQuery = searchDriveQueryFactory();

export const makeDriveRouter = () =>
  router({
    createUpload: organizationProcedure
      .input(
        z.object({
          eventId: z.string().optional(),
          folderId: z.string().nullish(),
          mimeType: z.string().min(1),
          sizeBytes: z.number().int().positive(),
          filename: z.string().min(1),
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
            getPersonalOrganizationId: async (userId: string) =>
              (await getPersonalOrganizationQuery(ctx.db, userId))?.id,
            resolveOrganizationEntitlements: (scope) =>
              resolveEntitlements(
                { resolvePlan: (planScope) => resolvePlanQuery(ctx.db, planScope) },
                scope,
              ),
            getOrganizationStorageUsage: (scope) => getOrganizationStorageUsageQuery(ctx.db, scope),
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

    deleteFile: organizationProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        deleteFile(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFileByIdQuery,
            deleteFileByIdCommand,
          },
          { id: input.id, scope: ctx.organizationScope },
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
      .input(z.object({ id: z.string() }))
      .query(({ ctx, input }) =>
        getFileDownloadUrl(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFileByIdQuery,
          },
          { id: input.id, scope: ctx.organizationScope },
        ),
      ),

    moveFile: organizationProcedure
      .input(z.object({ id: z.string(), folderId: z.string().nullable() }))
      .mutation(({ ctx, input }) =>
        moveFile(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            findFolderByIdQuery,
            moveFileToFolderCommand,
          },
          { id: input.id, scope: ctx.organizationScope, folderId: input.folderId },
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
      .mutation(({ ctx, input }) =>
        deleteFolder(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            deleteFolderCascadeCommand,
          },
          { id: input.id, scope: ctx.organizationScope },
        ),
      ),

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
