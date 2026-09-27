import type { Command } from "commander";
import { registerBackfillDurationsCommand } from "./backfill-audio-duration";

export const registerDriveCommands = (program: Command) => {
  const drive = program.command("drive").description("Drive/file commands");

  registerBackfillDurationsCommand(drive);
};
