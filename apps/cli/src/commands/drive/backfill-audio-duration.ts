import type { Command } from "commander";
import { makeS3Storage } from "@echo/adapters/s3-storage";
import { backfillFileDurations } from "@echo/modules/drive/app";
import {
  findFilesMissingDurationQueryFactory,
  updateFileDurationByIdCommandFactory,
} from "@echo/modules/drive/infrastructure";
import { db } from "../../adapters/db";
import { cliConfig } from "../../config/index";
import { fetchBytes } from "../../lib/fetch-bytes";
import { parseDuration } from "../../lib/audio-metadata";

export const registerBackfillDurationsCommand = (parent: Command) => {
  parent
    .command("backfill-durations")
    .description("Compute and store duration for existing audio/video files missing it")
    .action(async () => {
      const result = await backfillFileDurations({
        db,
        findFilesMissingDurationQuery: findFilesMissingDurationQueryFactory(),
        updateFileDurationByIdCommand: updateFileDurationByIdCommandFactory(),
        s3Storage: makeS3Storage(cliConfig.s3),
        fetchBytes,
        parseDuration,
        onSkip: (file, error) => {
          console.error(`Skipped ${file.id} (${file.originalFilename}): ${String(error)}`);
        },
      });

      console.log(
        `Processed ${result.processed}, updated ${result.updated}, skipped ${result.skipped}.`,
      );
    });
};
