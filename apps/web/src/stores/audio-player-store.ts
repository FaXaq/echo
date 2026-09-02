import { create } from "zustand";

export type PlayableAudioFile = {
  id: string;
  filename: string;
  downloadUrl: string;
  contextLabel?: string;
};

export type AudioPlayerStatus = "loading" | "playing" | "paused" | "error";

const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const;

interface AudioPlayerState {
  file: PlayableAudioFile | null;
  pendingFile: PlayableAudioFile | null;
  status: AudioPlayerStatus;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: (typeof PLAYBACK_RATES)[number];
  errorMessage: string | null;
  requestPlay: (file: PlayableAudioFile) => void;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  cyclePlaybackRate: () => void;
  retry: () => void;
  dismiss: () => void;
}

const audio = typeof Audio !== "undefined" ? new Audio() : null;

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => {
  function handlePlaybackError() {
    set({ status: "error", errorMessage: "Can't play this file" });
  }

  if (audio) {
    audio.addEventListener("waiting", () => set({ status: "loading" }));
    audio.addEventListener("playing", () => set({ status: "playing", errorMessage: null }));
    audio.addEventListener("pause", () => {
      if (get().status !== "error") set({ status: "paused" });
    });
    audio.addEventListener("timeupdate", () => set({ currentTime: audio.currentTime }));
    audio.addEventListener("durationchange", () => set({ duration: audio.duration || 0 }));
    audio.addEventListener("ended", () => set({ status: "paused", currentTime: 0 }));
    audio.addEventListener("error", handlePlaybackError);
  }

  function playFile(file: PlayableAudioFile) {
    if (!audio) return;
    set({
      file,
      pendingFile: null,
      status: "loading",
      currentTime: 0,
      duration: 0,
      errorMessage: null,
    });
    audio.src = file.downloadUrl;
    audio.playbackRate = get().playbackRate;
    audio.volume = get().volume;
    audio.play().catch(handlePlaybackError);
  }

  return {
    file: null,
    pendingFile: null,
    status: "paused",
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    errorMessage: null,

    requestPlay: (file) => {
      if (get().file === null) {
        playFile(file);
      } else {
        set({ pendingFile: file });
      }
    },

    confirmSwitch: () => {
      const { pendingFile } = get();
      if (pendingFile) playFile(pendingFile);
    },

    cancelSwitch: () => set({ pendingFile: null }),

    toggle: () => {
      if (!audio || !get().file) return;
      if (get().status === "playing") audio.pause();
      else audio.play().catch(handlePlaybackError);
    },

    seek: (time) => {
      if (!audio) return;
      audio.currentTime = time;
      set({ currentTime: time });
    },

    setVolume: (volume) => {
      if (audio) audio.volume = volume;
      set({ volume });
    },

    cyclePlaybackRate: () => {
      const currentIndex = PLAYBACK_RATES.indexOf(get().playbackRate);
      const next = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length];
      if (audio) audio.playbackRate = next;
      set({ playbackRate: next });
    },

    retry: () => {
      const { file } = get();
      if (file) playFile(file);
    },

    dismiss: () => {
      if (audio) audio.pause();
      set({ file: null, pendingFile: null, status: "paused", currentTime: 0, duration: 0 });
    },
  };
});
