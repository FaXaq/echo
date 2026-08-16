import { z } from "zod";
import {
  confirmUpload,
  createUpload,
  deleteFile,
  listEventFiles,
  listOrganizationFiles,
  renameFile,
} from "@echo/modules/file/app";
import {
  deleteFileByIdCommandFactory,
  findFileByIdQueryFactory,
  insertPendingFileCommandFactory,
  listFilesByEventQueryFactory,
  listFilesByOrganizationQueryFactory,
  markFileUploadedCommandFactory,
  renameFileByIdCommandFactory,
} from "@echo/modules/file/infrastructure";
import { getPersonalOrganizationQuery } from "@echo/modules/organization/infrastructure";
import { resolveEntitlements } from "@echo/modules/plan/app";
import {
  getOrganizationStorageUsageQuery,
  resolvePlanQuery,
} from "@echo/modules/plan/infrastructure";
import { organizationProcedure, router } from "../trpc";

const insertPendingFileCommand = insertPendingFileCommandFactory();
const findFileByIdQuery = findFileByIdQueryFactory();
const markFileUploadedCommand = markFileUploadedCommandFactory();
const listFilesByEventQuery = listFilesByEventQueryFactory();
const listFilesByOrganizationQuery = listFilesByOrganizationQueryFactory();
const deleteFileByIdCommand = deleteFileByIdCommandFactory();
const renameFileByIdCommand = renameFileByIdCommandFactory();

export const makeFileRouter = () =>
  router({
    createUpload: organizationProcedure
      .input(
        z.object({
          eventId: z.string().optional(),
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
  });
