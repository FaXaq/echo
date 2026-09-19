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
      onToggle={toggle}
      onSeek={seek}
      onVolumeChange={setVolume}
      onCycleRate={cyclePlaybackRate}
      onRetry={retry}
      onDismiss={dismiss}
    />
  );
}
