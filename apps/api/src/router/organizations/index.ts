import { router } from "../../trpc";
import { makeSongRouter } from "./song";
import { makeTrackRouter } from "./track";
import { makeAudioClipRouter } from "./audio-clip";
import { makeMidiClipRouter } from "./midi-clip";

export const makeOrganizationRouter = () =>
  router({
    song: makeSongRouter(),
    track: makeTrackRouter(),
    audioClip: makeAudioClipRouter(),
    midiClip: makeMidiClipRouter(),
  });
