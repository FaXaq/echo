import { z } from "zod";
import { organizationProcedure, router } from "../trpc";
import {
  listOutreachColumns,
  createOutreachColumn,
  renameOutreachColumn,
  reorderOutreachColumn,
  deleteOutreachColumn,
  listOutreachCards,
  createOutreachCard,
  updateOutreachCard,
  moveOutreachCard,
  deleteOutreachCard,
  linkOutreachContactToCard,
  unlinkOutreachContactFromCard,
  listOutreachCardContacts,
} from "@echo/modules/outreach/app";
import {
  listOutreachColumnsQueryFactory,
  seedDefaultOutreachColumnsCommandFactory,
  insertOutreachColumnCommandFactory,
  renameOutreachColumnCommandFactory,
  moveOutreachColumnCommandFactory,
  countOutreachCardsInColumnQueryFactory,
  deleteOutreachColumnCommandFactory,
  listOutreachCardsQueryFactory,
  insertOutreachCardCommandFactory,
  updateOutreachCardCommandFactory,
  moveOutreachCardCommandFactory,
  deleteOutreachCardCommandFactory,
  linkOutreachContactToCardCommandFactory,
  unlinkOutreachContactFromCardCommandFactory,
  listOutreachCardContactsQueryFactory,
} from "@echo/modules/outreach/infrastructure";

const placeInput = z
  .object({
    name: z.string().min(1),
    address: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .nullable();

const listOutreachColumnsQuery = listOutreachColumnsQueryFactory();
const seedDefaultOutreachColumnsCommand = seedDefaultOutreachColumnsCommandFactory();
const insertOutreachColumnCommand = insertOutreachColumnCommandFactory();
const renameOutreachColumnCommand = renameOutreachColumnCommandFactory();
const moveOutreachColumnCommand = moveOutreachColumnCommandFactory();
const countOutreachCardsInColumnQuery = countOutreachCardsInColumnQueryFactory();
const deleteOutreachColumnCommand = deleteOutreachColumnCommandFactory();
const listOutreachCardsQuery = listOutreachCardsQueryFactory();
const insertOutreachCardCommand = insertOutreachCardCommandFactory();
const updateOutreachCardCommand = updateOutreachCardCommandFactory();
const moveOutreachCardCommand = moveOutreachCardCommandFactory();
const deleteOutreachCardCommand = deleteOutreachCardCommandFactory();
const linkOutreachContactToCardCommand = linkOutreachContactToCardCommandFactory();
const unlinkOutreachContactFromCardCommand = unlinkOutreachContactFromCardCommandFactory();
const listOutreachCardContactsQuery = listOutreachCardContactsQueryFactory();

export const makeOutreachRouter = () =>
  router({
    listColumns: organizationProcedure.query(({ ctx }) =>
      listOutreachColumns(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          listOutreachColumnsQuery,
          seedDefaultOutreachColumnsCommand,
        },
        { scope: ctx.organizationScope },
      ),
    ),

    createColumn: organizationProcedure
      .input(z.object({ name: z.string().min(1, "Name is required") }))
      .mutation(({ ctx, input }) =>
        createOutreachColumn(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listOutreachColumnsQuery,
            insertOutreachColumnCommand,
          },
          { scope: ctx.organizationScope, name: input.name },
        ),
      ),

    renameColumn: organizationProcedure
      .input(z.object({ id: z.string(), name: z.string().min(1, "Name is required") }))
      .mutation(({ ctx, input }) =>
        renameOutreachColumn(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            renameOutreachColumnCommand,
          },
          { scope: ctx.organizationScope, id: input.id, name: input.name },
        ),
      ),

    reorderColumn: organizationProcedure
      .input(
        z.object({
          id: z.string(),
          beforeId: z.string().nullable(),
          afterId: z.string().nullable(),
        }),
      )
      .mutation(({ ctx, input }) =>
        reorderOutreachColumn(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listOutreachColumnsQuery,
            moveOutreachColumnCommand,
          },
          {
            scope: ctx.organizationScope,
            id: input.id,
            beforeId: input.beforeId,
            afterId: input.afterId,
          },
        ),
      ),

    deleteColumn: organizationProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        deleteOutreachColumn(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            countOutreachCardsInColumnQuery,
            deleteOutreachColumnCommand,
          },
          { scope: ctx.organizationScope, id: input.id },
        ),
      ),

    listCards: organizationProcedure.query(({ ctx }) =>
      listOutreachCards(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          listOutreachCardsQuery,
        },
        { scope: ctx.organizationScope },
      ),
    ),

    createCard: organizationProcedure
      .input(
        z.object({
          columnId: z.string(),
          title: z.string().min(1, "Title is required"),
          place: placeInput.optional(),
          description: z.string().optional(),
          assigneeId: z.string().nullable().optional(),
        }),
      )
      .mutation(({ ctx, input }) =>
        createOutreachCard(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listOutreachCardsQuery,
            insertOutreachCardCommand,
          },
          {
            scope: ctx.organizationScope,
            userId: ctx.session.user.id,
            columnId: input.columnId,
            title: input.title,
            place: input.place ?? null,
            description: input.description ?? null,
            assigneeId: input.assigneeId ?? null,
          },
        ),
      ),

    updateCard: organizationProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().min(1, "Title is required"),
          place: placeInput.optional(),
          description: z.string().optional(),
          assigneeId: z.string().nullable().optional(),
        }),
      )
      .mutation(({ ctx, input }) =>
        updateOutreachCard(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            updateOutreachCardCommand,
          },
          {
            scope: ctx.organizationScope,
            userId: ctx.session.user.id,
            id: input.id,
            title: input.title,
            place: input.place ?? null,
            description: input.description ?? null,
            assigneeId: input.assigneeId ?? null,
          },
        ),
      ),

    moveCard: organizationProcedure
      .input(
        z.object({
          id: z.string(),
          columnId: z.string(),
          beforeId: z.string().nullable(),
          afterId: z.string().nullable(),
        }),
      )
      .mutation(({ ctx, input }) =>
        moveOutreachCard(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listOutreachCardsQuery,
            moveOutreachCardCommand,
          },
          {
            scope: ctx.organizationScope,
            id: input.id,
            columnId: input.columnId,
            beforeId: input.beforeId,
            afterId: input.afterId,
          },
        ),
      ),

    deleteCard: organizationProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        deleteOutreachCard(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            deleteOutreachCardCommand,
          },
          { scope: ctx.organizationScope, id: input.id },
        ),
      ),

    listCardContacts: organizationProcedure
      .input(z.object({ cardId: z.string() }))
      .query(({ ctx, input }) =>
        listOutreachCardContacts(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listOutreachCardContactsQuery,
          },
          { scope: ctx.organizationScope, cardId: input.cardId },
        ),
      ),

    linkContactToCard: organizationProcedure
      .input(z.object({ cardId: z.string(), contactId: z.string() }))
      .mutation(({ ctx, input }) =>
        linkOutreachContactToCard(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            linkOutreachContactToCardCommand,
          },
          { scope: ctx.organizationScope, cardId: input.cardId, contactId: input.contactId },
        ),
      ),

    unlinkContactFromCard: organizationProcedure
      .input(z.object({ cardId: z.string(), contactId: z.string() }))
      .mutation(({ ctx, input }) =>
        unlinkOutreachContactFromCard(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            unlinkOutreachContactFromCardCommand,
          },
          { scope: ctx.organizationScope, cardId: input.cardId, contactId: input.contactId },
        ),
      ),
  });
