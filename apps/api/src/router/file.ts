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
  findFileById,
  insertPendingFile,
  markFileUploaded,
} from "@echo/modules/file/infrastructure";
import { getPersonalOrganizationQuery } from "@echo/modules/organization/infrastructure";
import { resolveEntitlements } from "@echo/modules/plan/app";
import {
  getOrganizationStorageUsageQuery,
  resolvePlanQuery,
} from "@echo/modules/plan/infrastructure";
import { authedProcedure, router } from "../trpc";

export const makeFileRouter = () =>
  router({
    createUpload: authedProcedure
      .input(
        z.object({
          eventId: z.string().optional(),
          organizationId: z.string().optional(),
          mimeType: z.string().min(1),
          sizeBytes: z.number().int().positive(),
          filename: z.string().min(1),
        }),
      )
      .mutation(({ ctx, input }) =>
        createUpload(
          {
            s3Storage: ctx.s3Storage,
            userHasPermission: ctx.userHasPermission,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            insertPendingFile: (fileInput) => insertPendingFile(ctx.db, fileInput),
            getPersonalOrganizationId: async (userId: string) =>
              (await getPersonalOrganizationQuery(ctx.db, userId))?.id,
            resolveOrganizationEntitlements: (organizationId: string) =>
              resolveEntitlements(
                { resolvePlan: (id: string) => resolvePlanQuery(ctx.db, id) },
                organizationId,
              ),
            getOrganizationStorageUsage: (organizationId: string) =>
              getOrganizationStorageUsageQuery(ctx.db, organizationId),
          },
          { userId: ctx.session.user.id, ...input },
        ),
      ),

    confirmUpload: authedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) =>
      confirmUpload(
        {
          s3Storage: ctx.s3Storage,
          findFileById: (id) => findFileById(ctx.db, id),
          markFileUploaded: (id, sizeBytes) => markFileUploaded(ctx.db, id, sizeBytes),
        },
        input,
      ),
    ),

    listEventFiles: authedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(({ ctx, input }) =>
        listEventFiles(
          {
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermission: ctx.userHasPermission,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          { eventId: input.eventId, userId: ctx.session.user.id },
        ),
      ),

    listOrganizationFiles: authedProcedure
      .input(z.object({ organizationId: z.string() }))
      .query(({ ctx, input }) =>
        listOrganizationFiles(
          { db: ctx.db, userHasPermissionInOrganization: ctx.userHasPermissionInOrganization },
          { organizationId: input.organizationId },
        ),
      ),

    deleteFile: authedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) =>
      deleteFile(
        {
          db: ctx.db,
          s3Storage: ctx.s3Storage,
          userHasPermission: ctx.userHasPermission,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
        },
        { id: input.id, userId: ctx.session.user.id },
      ),
    ),

    renameFile: authedProcedure
      .input(z.object({ id: z.string(), filename: z.string().min(1) }))
      .mutation(({ ctx, input }) =>
        renameFile(
          {
            db: ctx.db,
            userHasPermission: ctx.userHasPermission,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          { id: input.id, userId: ctx.session.user.id, filename: input.filename },
        ),
      ),
  });
