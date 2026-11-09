import type { Command } from "commander";
import { makeS3Storage } from "@echo/adapters/s3-storage";
import { backfillFileDimensions } from "@echo/modules/drive/app";
import {
  findFilesMissingDimensionsQueryFactory,
  updateFileDimensionsByIdCommandFactory,
} from "@echo/modules/drive/infrastructure";
import { db } from "../../adapters/db";
import { cliConfig } from "../../config/index";
import { fetchBytes } from "../../lib/fetch-bytes";
import { readImageSize } from "../../lib/thumbnails";

export const registerBackfillDimensionsCommand = (parent: Command) => {
  parent
    .command("backfill-dimensions")
    .description("Record dimensions for existing images and videos from their thumbnails")
    .action(async () => {
      const result = await backfillFileDimensions({
        db,
        findFilesMissingDimensionsQuery: findFilesMissingDimensionsQueryFactory(),
        updateFileDimensionsByIdCommand: updateFileDimensionsByIdCommandFactory(),
        s3Storage: makeS3Storage(cliConfig.s3),
        fetchBytes,
        readImageSize,
        onSkip: (file, error) => {
          console.error(`Skipped ${file.id} (${file.originalFilename}): ${String(error)}`);
        },
      });

      console.log(
        `Processed ${result.processed}, updated ${result.updated}, skipped ${result.skipped}.`,
      );
    });
};
