import { z } from "zod";
import { organizationProcedure, router } from "../trpc";
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
    getEventById: organizationProcedure
      .input(z.object({ eventId: z.string() }))
      .query(({ ctx, input }) =>
        getEventById(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            getCalendarEventById,
          },
          { scope: ctx.organizationScope, eventId: input.eventId },
        ),
      ),

    listEvents: organizationProcedure.query(({ ctx }) =>
      listEvents(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          listCalendarEventsQuery,
        },
        { scope: ctx.organizationScope },
      ),
    ),

    createEvent: organizationProcedure.input(z.object(eventInput)).mutation(({ ctx, input }) =>
      createEvent(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          insertCalendarEventCommand,
        },
        { ...input, scope: ctx.organizationScope, userId: ctx.session.user.id },
      ),
    ),

    updateEvent: organizationProcedure
      .input(z.object({ id: z.string(), ...eventInput }))
      .mutation(({ ctx, input }) =>
        updateEvent(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            updateCalendarEventCommand,
          },
          { ...input, scope: ctx.organizationScope, userId: ctx.session.user.id },
        ),
      ),

    deleteEvent: organizationProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const failures = await deleteEvent(
          {
            db: ctx.db,
            userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
            deleteCalendarEventCommand,
            s3Storage: ctx.s3Storage,
          },
          { id: input.id, scope: ctx.organizationScope },
        );
        for (const failure of failures) {
          ctx.logger.error(
            { error: failure.error, fileId: failure.fileId, eventId: input.id },
            "Failed to delete S3 object during event deletion",
          );
        }
      }),
  });
