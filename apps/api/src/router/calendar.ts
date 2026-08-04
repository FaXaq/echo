import { z } from "zod";
import { router, authedProcedure } from "../trpc";
import { createEvent, listEvents, updateEvent, deleteEvent } from "@echo/modules/calendar/app";
import { EVENT_COLORS, type EventColor } from "@echo/modules/calendar/domain";

const colorSchema = z.enum(EVENT_COLORS as [EventColor, ...EventColor[]]);

const eventInput = {
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  allDay: z.boolean().optional(),
  color: colorSchema,
  place: z
    .object({
      name: z.string().min(1),
      address: z.string().min(1),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .nullable()
    .optional(),
};

export const makeCalendarRouter = () =>
  router({
    listEvents: authedProcedure
      .input(z.object({ organizationId: z.string().optional() }))
      .query(({ ctx, input }) =>
        listEvents(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          { organizationId: input.organizationId ?? null, userId: ctx.session.user.id },
        ),
      ),

    createEvent: authedProcedure
      .input(z.object({ organizationId: z.string().optional(), ...eventInput }))
      .mutation(({ ctx, input }) =>
        createEvent(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          { ...input, organizationId: input.organizationId ?? null, userId: ctx.session.user.id },
        ),
      ),

    updateEvent: authedProcedure
      .input(z.object({ id: z.string(), organizationId: z.string().optional(), ...eventInput }))
      .mutation(({ ctx, input }) =>
        updateEvent(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          { ...input, organizationId: input.organizationId ?? null, userId: ctx.session.user.id },
        ),
      ),

    deleteEvent: authedProcedure
      .input(z.object({ id: z.string(), organizationId: z.string().optional() }))
      .mutation(({ ctx, input }) =>
        deleteEvent(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          },
          {
            id: input.id,
            organizationId: input.organizationId ?? null,
            userId: ctx.session.user.id,
          },
        ),
      ),
  });
