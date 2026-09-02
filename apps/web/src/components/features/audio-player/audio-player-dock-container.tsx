import { useLingui } from "@lingui/react/macro";
import { AudioPlayerDock } from "@/components/ui/audio-player-dock";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAudioPlayerStore } from "@/stores/audio-player-store";

export function AudioPlayerDockContainer() {
  const { t } = useLingui();
  const file = useAudioPlayerStore((s) => s.file);
  const pendingFile = useAudioPlayerStore((s) => s.pendingFile);
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
  const confirmSwitch = useAudioPlayerStore((s) => s.confirmSwitch);
  const cancelSwitch = useAudioPlayerStore((s) => s.cancelSwitch);

  return (
    <>
      {file && (
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
      )}

      <ConfirmDialog
        open={pendingFile !== null}
        onOpenChange={(open) => !open && cancelSwitch()}
        title={t`Play ${pendingFile?.filename ?? ""} instead?`}
        description={t`${file?.filename ?? "This file"} is currently playing.`}
        confirmLabel={t`Play`}
        onConfirm={confirmSwitch}
      />
    </>
  );
}
