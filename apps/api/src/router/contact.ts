import { z } from "zod";
import { organizationProcedure, router } from "../trpc";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
} from "@echo/modules/contact/app";
import {
  listContactsQueryFactory,
  insertContactCommandFactory,
  updateContactCommandFactory,
  deleteContactCommandFactory,
} from "@echo/modules/contact/infrastructure";

const listContactsQuery = listContactsQueryFactory();
const insertContactCommand = insertContactCommandFactory();
const updateContactCommand = updateContactCommandFactory();
const deleteContactCommand = deleteContactCommandFactory();

export const makeContactRouter = () =>
  router({
    list: organizationProcedure.query(({ ctx }) =>
      listContacts(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          listContactsQuery,
        },
        { scope: ctx.organizationScope },
      ),
    ),

    create: organizationProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          description: z.string().optional(),
        }),
      )
      .mutation(({ ctx, input }) =>
        createContact(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            insertContactCommand,
          },
          {
            scope: ctx.organizationScope,
            name: input.name,
            phone: input.phone ?? null,
            email: input.email ?? null,
            description: input.description ?? null,
          },
        ),
      ),

    update: organizationProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().min(1, "Name is required"),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          description: z.string().optional(),
        }),
      )
      .mutation(({ ctx, input }) =>
        updateContact(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            updateContactCommand,
          },
          {
            scope: ctx.organizationScope,
            id: input.id,
            name: input.name,
            phone: input.phone ?? null,
            email: input.email ?? null,
            description: input.description ?? null,
          },
        ),
      ),

    delete: organizationProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) =>
      deleteContact(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          deleteContactCommand,
        },
        { scope: ctx.organizationScope, id: input.id },
      ),
    ),
  });
