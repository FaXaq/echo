import { z } from "zod";
import { router, authedProcedure } from "../trpc";
import {
  createUserEvent,
  createOrganizationEvent,
  listUserEvents,
  listOrganizationEvents,
  updateUserEvent,
  updateOrganizationEvent,
  deleteUserEvent,
  deleteOrganizationEvent,
} from "@echo/modules/calendar/app";
import { EVENT_COLORS, type EventColor } from "@echo/modules/calendar/domain";

const colorSchema = z.enum(EVENT_COLORS as [EventColor, ...EventColor[]]);

const eventInput = {
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  allDay: z.boolean().optional(),
  color: colorSchema,
};

export const makeCalendarRouter = () =>
  router({
    listUserEvents: authedProcedure.query(({ ctx }) =>
      listUserEvents({ db: ctx.db }, { userId: ctx.session.user.id }),
    ),

    listOrganizationEvents: authedProcedure
      .input(z.object({ organizationId: z.string() }))
      .query(({ ctx, input }) =>
        listOrganizationEvents(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          { organizationId: input.organizationId, userId: ctx.session.user.id },
        ),
      ),

    createUserEvent: authedProcedure
      .input(z.object(eventInput))
      .mutation(({ ctx, input }) =>
        createUserEvent({ db: ctx.db }, { userId: ctx.session.user.id, ...input }),
      ),

    createOrganizationEvent: authedProcedure
      .input(z.object({ organizationId: z.string(), ...eventInput }))
      .mutation(({ ctx, input }) =>
        createOrganizationEvent(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          { userId: ctx.session.user.id, ...input },
        ),
      ),

    updateUserEvent: authedProcedure
      .input(z.object({ id: z.string(), ...eventInput }))
      .mutation(({ ctx, input }) =>
        updateUserEvent({ db: ctx.db }, { userId: ctx.session.user.id, ...input }),
      ),

    updateOrganizationEvent: authedProcedure
      .input(z.object({ id: z.string(), organizationId: z.string(), ...eventInput }))
      .mutation(({ ctx, input }) =>
        updateOrganizationEvent(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          { userId: ctx.session.user.id, ...input },
        ),
      ),

    deleteUserEvent: authedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        deleteUserEvent({ db: ctx.db }, { id: input.id, userId: ctx.session.user.id }),
      ),

    deleteOrganizationEvent: authedProcedure
      .input(z.object({ id: z.string(), organizationId: z.string() }))
      .mutation(({ ctx, input }) =>
        deleteOrganizationEvent(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          { id: input.id, organizationId: input.organizationId, userId: ctx.session.user.id },
        ),
      ),
  });
