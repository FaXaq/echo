import { create } from "zustand";

export type PlayableAudioFile = {
  id: string;
  filename: string;
  downloadUrl: string;
  contextLabel?: string;
  songId?: string;
};

export type QueueItem = {
  songId: string;
  title: string;
  artist: string | null;
  durationSeconds: number;
  file: { id: string; filename: string; downloadUrl: string };
};

export type AudioPlayerStatus = "loading" | "playing" | "paused" | "error" | "waiting";

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

interface AudioPlayerState {
  file: PlayableAudioFile | null;
  status: AudioPlayerStatus;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: (typeof PLAYBACK_RATES)[number];
  errorMessage: string | null;
  /** Songs still to come after the one currently playing. */
  queue: QueueItem[];
  queueIntervalSeconds: number;
  requestPlay: (file: PlayableAudioFile) => void;
  playQueue: (items: QueueItem[], intervalSeconds: number) => void;
  skipNext: () => void;
  jumpToQueueItem: (index: number) => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  cyclePlaybackRate: () => void;
  retry: () => void;
  dismiss: () => void;
}

const audio = typeof Audio !== "undefined" ? new Audio() : null;

let pendingAdvanceTimeout: ReturnType<typeof setInterval> | null = null;

function clearPendingAdvance() {
  if (pendingAdvanceTimeout !== null) {
    clearInterval(pendingAdvanceTimeout);
    pendingAdvanceTimeout = null;
  }
}

const ADVANCE_TICK_MS = 100;

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => {
  function handlePlaybackError() {
    set({ status: "error", errorMessage: "Can't play this file" });
  }

  function playFile(file: PlayableAudioFile) {
    if (!audio) return;
    set({
      file,
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

  // Plays one queue item and stores whatever's left of the queue behind it.
  function playQueueItem(item: QueueItem, remainingQueue: QueueItem[]) {
    clearPendingAdvance();
    set({ queue: remainingQueue });
    playFile({
      id: item.file.id,
      filename: item.file.filename,
      downloadUrl: item.file.downloadUrl,
      contextLabel: item.title,
      songId: item.songId,
    });
  }

  // Seam for all three ways playback moves to another queued song: the current song ending
  // naturally, the user clicking "Next", and the user clicking a specific song in the queue popover.
  function advanceQueue(
    next: QueueItem | undefined,
    remainingQueue: QueueItem[],
    immediate: boolean,
  ) {
    if (!next) {
      set({ status: "paused", currentTime: 0 });
      return;
    }

    clearPendingAdvance();

    const totalSeconds = get().queueIntervalSeconds;
    if (immediate || totalSeconds <= 0) {
      playQueueItem(next, remainingQueue);
      return;
    }

    // "waiting" repurposes currentTime/duration as a countdown (0 -> totalSeconds) so the dock can
    // show it as a progress slider, same as real playback. Integer ms accumulation avoids float drift.
    let elapsedMs = 0;
    set({ status: "waiting", currentTime: 0, duration: totalSeconds });
    pendingAdvanceTimeout = setInterval(() => {
      elapsedMs += ADVANCE_TICK_MS;
      if (elapsedMs >= totalSeconds * 1000) {
        clearPendingAdvance();
        playQueueItem(next, remainingQueue);
      } else {
        set({ currentTime: elapsedMs / 1000 });
      }
    }, ADVANCE_TICK_MS);
  }

  if (audio) {
    audio.addEventListener("waiting", () => set({ status: "loading" }));
    audio.addEventListener("playing", () => set({ status: "playing", errorMessage: null }));
    audio.addEventListener("pause", () => {
      if (get().status !== "error") set({ status: "paused" });
    });
    audio.addEventListener("timeupdate", () => set({ currentTime: audio.currentTime }));
    audio.addEventListener("durationchange", () => set({ duration: audio.duration || 0 }));
    audio.addEventListener("error", handlePlaybackError);
    audio.addEventListener("ended", () => {
      const [next, ...rest] = get().queue;
      advanceQueue(next, rest, false);
    });
  }

  return {
    file: null,
    status: "paused",
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    errorMessage: null,
    queue: [],
    queueIntervalSeconds: 0,

    requestPlay: (file) => {
      clearPendingAdvance();
      set({ queue: [], queueIntervalSeconds: 0 });
      playFile(file);
    },

    playQueue: (items, intervalSeconds) => {
      const [first, ...rest] = items;
      if (!first) return;
      set({ queueIntervalSeconds: intervalSeconds });
      playQueueItem(first, rest);
    },

    skipNext: () => {
      const [next, ...rest] = get().queue;
      advanceQueue(next, rest, true);
    },

    jumpToQueueItem: (index) => {
      const queue = get().queue;
      advanceQueue(queue[index], queue.slice(index + 1), true);
    },

    toggle: () => {
      if (!audio || !get().file || get().status === "waiting") return;
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
      clearPendingAdvance();
      if (audio) audio.pause();
      set({
        file: null,
        status: "paused",
        currentTime: 0,
        duration: 0,
        queue: [],
        queueIntervalSeconds: 0,
      });
    },
  };
});
