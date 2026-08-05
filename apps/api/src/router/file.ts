import { z } from "zod";
import {
  confirmUpload,
  createUpload,
  deleteFile,
  listEventFiles,
} from "@echo/modules/file/app";
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
            db: ctx.db,
            s3Storage: ctx.s3Storage,
            userHasPermission: ctx.userHasPermission,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          { userId: ctx.session.user.id, ...input },
        ),
      ),

    confirmUpload: authedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) => confirmUpload({ db: ctx.db, s3Storage: ctx.s3Storage }, input)),

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

    deleteFile: authedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
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
  });
