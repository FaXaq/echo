import { z } from "zod";
import { router, authedProcedure } from "../trpc";
import {
  createEvent,
  listEvents,
  updateEvent,
  deleteEvent,
  getEventById,
} from "@echo/modules/calendar/app";
import { EVENT_COLORS, eventTypeSchema, type EventColor } from "@echo/modules/calendar/domain";
import {
  insertCalendarEventCommandFactory,
  updateCalendarEventCommandFactory,
  deleteCalendarEventCommandFactory,
  listCalendarEventsQueryFactory,
  getCalendarEventByIdFactory,
} from "@echo/modules/calendar/infrastructure";

const colorSchema = z.enum(EVENT_COLORS as [EventColor, ...EventColor[]]);

const eventInput = {
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  allDay: z.boolean().optional(),
  color: colorSchema,
  type: eventTypeSchema.nullable().optional(),
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

const insertCalendarEventCommand = insertCalendarEventCommandFactory();
const updateCalendarEventCommand = updateCalendarEventCommandFactory();
const deleteCalendarEventCommand = deleteCalendarEventCommandFactory();
const listCalendarEventsQuery = listCalendarEventsQueryFactory();
const getCalendarEventById = getCalendarEventByIdFactory();

export const makeCalendarRouter = () =>
  router({
    getEventById: authedProcedure
      .input(z.object({ eventId: z.string(), organizationId: z.string().optional() }))
      .query(({ ctx, input }) =>
        getEventById(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            getCalendarEventById,
          },
          { organizationId: input.organizationId ?? null, eventId: input.eventId },
        ),
      ),

    listEvents: authedProcedure
      .input(z.object({ organizationId: z.string().optional() }))
      .query(({ ctx, input }) =>
        listEvents(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            listCalendarEventsQuery,
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
            insertCalendarEventCommand,
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
            updateCalendarEventCommand,
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
            deleteCalendarEventCommand,
          },
          {
            id: input.id,
            organizationId: input.organizationId ?? null,
            userId: ctx.session.user.id,
          },
        ),
      ),
  });
