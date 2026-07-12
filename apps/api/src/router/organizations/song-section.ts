import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  createSectionDefinition,
  updateSectionDefinition,
  deleteSectionDefinition,
  listSectionDefinitions,
  createSectionInstance,
  updateSectionInstance,
  deleteSectionInstance,
  listSectionInstances,
  reorderSectionInstances,
} from "@echo/modules/song-section/app";

const chordSchema = z.object({
  at: z.number().min(0.5),
  chord: z.string().min(1),
});

export const makeSongSectionRouter = () =>
  router({
    definition: router({
      create: authedProcedure
        .input(
          z.object({
            songId: z.string().min(1),
            name: z.string().min(1, "Name is required"),
            chords: z.array(chordSchema).optional(),
            lyrics: z.string().nullable().optional(),
            color: z.string().nullable().optional(),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return createSectionDefinition(
            { db: ctx.db, definitionRepo: ctx.songSectionDefinition },
            input,
          );
        }),

      update: authedProcedure
        .input(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1).optional(),
            chords: z.array(chordSchema).optional(),
            lyrics: z.string().nullable().optional(),
            color: z.string().nullable().optional(),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return updateSectionDefinition(
            { db: ctx.db, definitionRepo: ctx.songSectionDefinition },
            input,
          );
        }),

      delete: authedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
          await deleteSectionDefinition(
            { db: ctx.db, definitionRepo: ctx.songSectionDefinition },
            input,
          );
        }),

      list: authedProcedure
        .input(z.object({ songId: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
          return listSectionDefinitions(
            { db: ctx.db, definitionRepo: ctx.songSectionDefinition },
            input,
          );
        }),
    }),

    instance: router({
      create: authedProcedure
        .input(
          z.object({
            songId: z.string().min(1),
            definitionId: z.string().min(1),
            lyricsOverride: z.string().nullable().optional(),
            lengthMeasures: z.number().positive().optional(),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return createSectionInstance(
            {
              db: ctx.db,
              instanceRepo: ctx.songSectionInstance,
              definitionRepo: ctx.songSectionDefinition,
            },
            input,
          );
        }),

      update: authedProcedure
        .input(
          z.object({
            id: z.string().min(1),
            startMeasure: z.number().min(1).optional(),
            lengthMeasures: z.number().positive().optional(),
            lyricsOverride: z.string().nullable().optional(),
            repeat: z.number().optional(),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return updateSectionInstance(
            { db: ctx.db, instanceRepo: ctx.songSectionInstance },
            input,
          );
        }),

      delete: authedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
          await deleteSectionInstance(
            { db: ctx.db, instanceRepo: ctx.songSectionInstance },
            input,
          );
        }),

      list: authedProcedure
        .input(z.object({ songId: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
          return listSectionInstances(
            { db: ctx.db, instanceRepo: ctx.songSectionInstance },
            input,
          );
        }),

      reorder: authedProcedure
        .input(
          z.object({
            songId: z.string().min(1),
            orderedIds: z.array(z.string().min(1)).min(1),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return reorderSectionInstances(
            { db: ctx.db, instanceRepo: ctx.songSectionInstance },
            input,
          );
        }),
    }),
  });
