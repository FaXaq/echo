import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  makeCreateSectionDefinition,
  makeUpdateSectionDefinition,
  makeDeleteSectionDefinition,
  makeListSectionDefinitions,
  makeCreateSectionInstance,
  makeUpdateSectionInstance,
  makeDeleteSectionInstance,
  makeListSectionInstances,
  makeReorderSectionInstances,
} from "@echo/modules/song-section/use-cases";

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
          return makeCreateSectionDefinition({ definitionRepo: ctx.songSectionDefinition })(input);
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
          return makeUpdateSectionDefinition({ definitionRepo: ctx.songSectionDefinition })(input);
        }),

      delete: authedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
          await makeDeleteSectionDefinition({ definitionRepo: ctx.songSectionDefinition })(input);
        }),

      list: authedProcedure
        .input(z.object({ songId: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
          return makeListSectionDefinitions({ definitionRepo: ctx.songSectionDefinition })(input);
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
          return makeCreateSectionInstance({
            instanceRepo: ctx.songSectionInstance,
            definitionRepo: ctx.songSectionDefinition,
          })(input);
        }),

      update: authedProcedure
        .input(
          z.object({
            id: z.string().min(1),
            startMeasure: z.number().min(1).optional(),
            lengthMeasures: z.number().positive().optional(),
            lyricsOverride: z.string().nullable().optional(),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return makeUpdateSectionInstance({ instanceRepo: ctx.songSectionInstance })(input);
        }),

      delete: authedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
          await makeDeleteSectionInstance({ instanceRepo: ctx.songSectionInstance })(input);
        }),

      list: authedProcedure
        .input(z.object({ songId: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
          return makeListSectionInstances({ instanceRepo: ctx.songSectionInstance })(input);
        }),

      reorder: authedProcedure
        .input(
          z.object({
            songId: z.string().min(1),
            orderedIds: z.array(z.string().min(1)).min(1),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          return makeReorderSectionInstances({ instanceRepo: ctx.songSectionInstance })(input);
        }),
    }),
  });
