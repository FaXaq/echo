import { router } from "../../trpc";
import { makeSongRouter } from "./song";
import { makeTrackRouter } from "./track";
import { makeAudioClipRouter } from "./audio-clip";

export const makeOrganizationRouter = () =>
  router({
    song: makeSongRouter(),
    track: makeTrackRouter(),
    audioClip: makeAudioClipRouter(),
  });
