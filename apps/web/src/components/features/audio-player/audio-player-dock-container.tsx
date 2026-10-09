import { useEffect } from "react";
import { AudioPlayerDock } from "@/components/ui/audio-player-dock";
import { useAudioPlayerStore } from "@/stores/audio-player-store";

export function AudioPlayerDockContainer() {
  const file = useAudioPlayerStore((s) => s.file);
  const status = useAudioPlayerStore((s) => s.status);
  const currentTime = useAudioPlayerStore((s) => s.currentTime);
  const duration = useAudioPlayerStore((s) => s.duration);
  const volume = useAudioPlayerStore((s) => s.volume);
  const playbackRate = useAudioPlayerStore((s) => s.playbackRate);
  const errorMessage = useAudioPlayerStore((s) => s.errorMessage);
  const toggle = useAudioPlayerStore((s) => s.toggle);
  const seek = useAudioPlayerStore((s) => s.seek);
  const setVolume = useAudioPlayerStore((s) => s.setVolume);
  const cyclePlaybackRate = useAudioPlayerStore((s) => s.cyclePlaybackRate);
  const retry = useAudioPlayerStore((s) => s.retry);
  const dismiss = useAudioPlayerStore((s) => s.dismiss);
  const queue = useAudioPlayerStore((s) => s.queue);
  const skipNext = useAudioPlayerStore((s) => s.skipNext);
  const jumpToQueueItem = useAudioPlayerStore((s) => s.jumpToQueueItem);

  const hasFile = file !== null;
  useEffect(() => {
    if (!hasFile) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasFile, toggle]);

  if (!file) return null;

  return (
    <AudioPlayerDock
      filename={file.filename}
      contextLabel={file.contextLabel}
      status={status}
      currentTime={currentTime}
      duration={duration}
      volume={volume}
      playbackRate={playbackRate}
      errorMessage={errorMessage}
      queue={queue}
      onToggle={toggle}
      onSeek={seek}
      onVolumeChange={setVolume}
      onCycleRate={cyclePlaybackRate}
      onRetry={retry}
      onDismiss={dismiss}
      onSkipNext={skipNext}
      onJumpToQueueItem={jumpToQueueItem}
    />
  );
}

// Space already types or activates on these, so don't hijack it there.
function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest("input, textarea, select, button, a, [role='button'], [role='slider']") !==
        null)
  );
}
