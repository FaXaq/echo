import type { Command } from "commander";
import { makeS3Storage } from "@echo/adapters/s3-storage";
import { backfillFileThumbnails } from "@echo/modules/drive/app";
import {
  findFilesMissingThumbnailQueryFactory,
  markFileHasThumbnailCommandFactory,
} from "@echo/modules/drive/infrastructure";
import { db } from "../../adapters/db";
import { cliConfig } from "../../config/index";
import { fetchBytes } from "../../lib/fetch-bytes";
import { captureVideoFrame, putBytes, resizeImage } from "../../lib/thumbnails";

export const registerBackfillThumbnailsCommand = (parent: Command) => {
  parent
    .command("backfill-thumbnails")
    .description("Generate thumbnails for existing images and videos missing one")
    .action(async () => {
      const result = await backfillFileThumbnails({
        db,
        findFilesMissingThumbnailQuery: findFilesMissingThumbnailQueryFactory(),
        markFileHasThumbnailCommand: markFileHasThumbnailCommandFactory(),
        s3Storage: makeS3Storage(cliConfig.s3),
        fetchBytes,
        resizeImage,
        captureVideoFrame,
        putBytes,
        onSkip: (file, error) => {
          console.error(`Skipped ${file.id} (${file.originalFilename}): ${String(error)}`);
        },
      });

      console.log(
        `Processed ${result.processed}, updated ${result.updated}, skipped ${result.skipped}.`,
      );
    });
};
