import { z } from "zod";
import { organizationProcedure, router } from "../trpc";
import {
  createExpense,
  createRepayment,
  deleteExpense,
  deleteRepayment,
  getLedgerSettings,
  getLedgerSummary,
  listExpenses,
  listRepayments,
  updateExpense,
  updateRepayment,
} from "@echo/modules/expense/app";
import {
  deleteExpenseCommandFactory,
  deleteRepaymentCommandFactory,
  getExpenseByIdQueryFactory,
  getOrganizationCurrencyQueryFactory,
  getRepaymentByIdQueryFactory,
  hasLedgerEntriesQueryFactory,
  insertExpenseCommandFactory,
  insertRepaymentCommandFactory,
  listExpensesQueryFactory,
  listLedgerParticipantsQueryFactory,
  listOrganizationMemberIdsQueryFactory,
  listRepaymentsQueryFactory,
  updateExpenseCommandFactory,
  updateRepaymentCommandFactory,
} from "@echo/modules/expense/infrastructure";
import { MAX_AMOUNT_MINOR } from "@echo/modules/expense/domain";
import { getCalendarEventByIdFactory } from "@echo/modules/calendar/infrastructure";

const insertExpenseCommand = insertExpenseCommandFactory();
const updateExpenseCommand = updateExpenseCommandFactory();
const deleteExpenseCommand = deleteExpenseCommandFactory();
const getExpenseByIdQuery = getExpenseByIdQueryFactory();
const listExpensesQuery = listExpensesQueryFactory();
const insertRepaymentCommand = insertRepaymentCommandFactory();
const updateRepaymentCommand = updateRepaymentCommandFactory();
const deleteRepaymentCommand = deleteRepaymentCommandFactory();
const getRepaymentByIdQuery = getRepaymentByIdQueryFactory();
const listRepaymentsQuery = listRepaymentsQueryFactory();
const listOrganizationMemberIdsQuery = listOrganizationMemberIdsQueryFactory();
const listLedgerParticipantsQuery = listLedgerParticipantsQueryFactory();
const getOrganizationCurrencyQuery = getOrganizationCurrencyQueryFactory();
const hasLedgerEntriesQuery = hasLedgerEntriesQueryFactory();
const getCalendarEventByIdQuery = getCalendarEventByIdFactory();

const amountMinor = z.number().int().positive().max(MAX_AMOUNT_MINOR);

const expenseInput = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  paidOn: z.iso.date(),
  amountMinor,
  currency: z.string().regex(/^[A-Z]{3}$/),
  exchangeRate: z.string().optional(),
  payerId: z.string(),
  eventId: z.string().optional(),
  split: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("equal"), userIds: z.array(z.string()) }),
    z.object({
      mode: z.literal("exact"),
      shares: z.array(z.object({ userId: z.string(), amountMinor })),
    }),
  ]),
});

const toDraft = (input: z.infer<typeof expenseInput>) => ({
  title: input.title,
  description: input.description ?? null,
  paidOn: input.paidOn,
  amountMinor: input.amountMinor,
  currency: input.currency,
  exchangeRate: input.exchangeRate ?? null,
  payerId: input.payerId,
  eventId: input.eventId ?? null,
  split: input.split,
});

const repaymentInput = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  amountMinor,
  paidOn: z.iso.date(),
  note: z.string().optional(),
});

const toRepaymentDraft = (input: z.infer<typeof repaymentInput>) => ({
  fromUserId: input.fromUserId,
  toUserId: input.toUserId,
  amountMinor: input.amountMinor,
  paidOn: input.paidOn,
  note: input.note ?? null,
});

export const makeExpenseRouter = () =>
  router({
    list: organizationProcedure
      .input(z.object({ eventId: z.string().optional() }))
      .query(({ ctx, input }) =>
        listExpenses(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listExpensesQuery,
          },
          { scope: ctx.organizationScope, eventId: input.eventId ?? null },
        ),
      ),

    summary: organizationProcedure.query(({ ctx }) =>
      getLedgerSummary(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          listExpensesQuery,
          listRepaymentsQuery,
          listLedgerParticipantsQuery,
          getOrganizationCurrencyQuery,
        },
        { scope: ctx.organizationScope },
      ),
    ),

    settings: organizationProcedure.query(({ ctx }) =>
      getLedgerSettings(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          getOrganizationCurrencyQuery,
          hasLedgerEntriesQuery,
        },
        { scope: ctx.organizationScope },
      ),
    ),

    create: organizationProcedure.input(expenseInput).mutation(({ ctx, input }) =>
      createExpense(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          insertExpenseCommand,
          getOrganizationCurrencyQuery,
          listOrganizationMemberIdsQuery,
          getCalendarEventByIdQuery,
        },
        { scope: ctx.organizationScope, userId: ctx.session.user.id, draft: toDraft(input) },
      ),
    ),

    update: organizationProcedure
      .input(expenseInput.extend({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        updateExpense(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            getExpenseByIdQuery,
            updateExpenseCommand,
            getOrganizationCurrencyQuery,
            listOrganizationMemberIdsQuery,
            getCalendarEventByIdQuery,
          },
          {
            scope: ctx.organizationScope,
            userId: ctx.session.user.id,
            id: input.id,
            draft: toDraft(input),
          },
        ),
      ),

    delete: organizationProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) =>
      deleteExpense(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          deleteExpenseCommand,
        },
        { scope: ctx.organizationScope, id: input.id },
      ),
    ),

    repayment: router({
      list: organizationProcedure.query(({ ctx }) =>
        listRepayments(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listRepaymentsQuery,
          },
          { scope: ctx.organizationScope },
        ),
      ),

      create: organizationProcedure.input(repaymentInput).mutation(({ ctx, input }) =>
        createRepayment(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            insertRepaymentCommand,
            listOrganizationMemberIdsQuery,
            listLedgerParticipantsQuery,
          },
          {
            scope: ctx.organizationScope,
            userId: ctx.session.user.id,
            draft: toRepaymentDraft(input),
          },
        ),
      ),

      update: organizationProcedure
        .input(repaymentInput.extend({ id: z.string() }))
        .mutation(({ ctx, input }) =>
          updateRepayment(
            {
              db: ctx.db,
              userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
              getRepaymentByIdQuery,
              updateRepaymentCommand,
              listOrganizationMemberIdsQuery,
              listLedgerParticipantsQuery,
            },
            { scope: ctx.organizationScope, id: input.id, draft: toRepaymentDraft(input) },
          ),
        ),

      delete: organizationProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) =>
        deleteRepayment(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            deleteRepaymentCommand,
          },
          { scope: ctx.organizationScope, id: input.id },
        ),
      ),
    }),
  });
