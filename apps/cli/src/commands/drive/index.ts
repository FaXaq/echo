import type { Command } from "commander";
import { registerBackfillDurationsCommand } from "./backfill-audio-duration";
import { registerBackfillThumbnailsCommand } from "./backfill-thumbnails";

export const registerDriveCommands = (program: Command) => {
  const drive = program.command("drive").description("Drive/file commands");

  registerBackfillDurationsCommand(drive);
  registerBackfillThumbnailsCommand(drive);
};
