import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { AlertTriangle, Pause, Play, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { formatDuration } from "@/lib/file";
import type { AudioPlayerStatus } from "@/stores/audio-player-store";

const PLAYBACK_RATE_LABELS: Record<number, string> = {
  1: "1.0×",
  1.25: "1.25×",
  1.5: "1.5×",
  2: "2.0×",
};

export interface AudioPlayerDockProps {
  filename: string;
  contextLabel?: string;
  status: AudioPlayerStatus;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  errorMessage: string | null;
  onToggle: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onCycleRate: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

export function AudioPlayerDock({
  filename,
  contextLabel,
  status,
  currentTime,
  duration,
  volume,
  playbackRate,
  errorMessage,
  onToggle,
  onSeek,
  onVolumeChange,
  onCycleRate,
  onRetry,
  onDismiss,
}: AudioPlayerDockProps) {
  const { t } = useLingui();
  const [dragValue, setDragValue] = useState<number | null>(null);

  if (status === "error") {
    return (
      <div className="fixed inset-x-0 bottom-3 z-50 mx-auto flex w-[min(640px,calc(100vw-32px))] items-center gap-3 rounded-full border border-destructive/45 bg-[color-mix(in_oklch,var(--destructive)_8%,var(--card))] py-2 pr-3 pl-2.5 shadow-lg">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[12.5px] font-medium text-destructive">
            {t`Can't play ${filename}`}
          </span>
          {errorMessage && (
            <span className="truncate text-[10.5px] text-muted-foreground">{errorMessage}</span>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {t`Retry`}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t`Dismiss`}
          onClick={onDismiss}
        >
          <X />
        </Button>
      </div>
    );
  }

  const isLoading = status === "loading";
  const isPlaying = status === "playing";

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 mx-auto flex w-[min(640px,calc(100vw-32px))] items-center gap-3 rounded-full border border-border bg-[color-mix(in_oklch,var(--card)_85%,transparent)] py-2 pr-3 pl-2 shadow-[0px_0px_10px_8px_rgba(0,0,0,0.05)] backdrop-blur-md">
      <Button
        type="button"
        size="icon"
        className="size-9 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/85"
        aria-label={isPlaying ? t`Pause` : t`Play`}
        disabled={isLoading}
        onClick={onToggle}
      >
        {isLoading ? (
          <Spinner className="size-4" />
        ) : isPlaying ? (
          <Pause className="size-3.5 fill-current" />
        ) : (
          <Play className="size-3.5 fill-current" />
        )}
      </Button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[12.5px] font-medium">{filename}</span>
          {contextLabel && (
            <span className="truncate text-[10.5px] text-muted-foreground">{contextLabel}</span>
          )}
        </div>
        <div className="relative">
          {dragValue !== null && duration > 0 && (
            <div
              className="pointer-events-none absolute bottom-full mb-1.5 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-background tabular-nums shadow-sm"
              style={{ left: `${(dragValue / duration) * 100}%` }}
            >
              {formatDuration(dragValue)}
            </div>
          )}
          <Slider
            value={[dragValue ?? Math.min(currentTime, duration || currentTime)]}
            min={0}
            max={duration || 0}
            step={0.1}
            disabled={isLoading || duration === 0}
            onValueChange={(value) => setDragValue(Array.isArray(value) ? value[0] : value)}
            onValueCommitted={(value) => {
              const time = Array.isArray(value) ? value[0] : value;
              onSeek(time);
              setDragValue(null);
            }}
          />
        </div>
      </div>

      <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </span>

      <div className="h-5 w-px shrink-0 bg-border" />

      <button
        type="button"
        className="shrink-0 px-1.5 font-mono text-[11px] font-medium text-muted-foreground hover:text-foreground"
        onClick={onCycleRate}
      >
        {PLAYBACK_RATE_LABELS[playbackRate] ?? `${playbackRate}×`}
      </button>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="rounded-full"
              aria-label={t`Volume`}
            />
          }
        >
          <Volume2 />
        </PopoverTrigger>
        <PopoverContent side="top" align="center" className="w-auto items-center py-3">
          <span className="font-mono text-[9.5px] tabular-nums text-muted-foreground">
            {Math.round(volume * 100)}
          </span>
          <Slider
            orientation="vertical"
            value={[volume * 100]}
            min={0}
            max={100}
            onValueChange={(value) =>
              onVolumeChange((Array.isArray(value) ? value[0] : value) / 100)
            }
            className="h-20"
          />
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="shrink-0 rounded-full"
        aria-label={t`Close`}
        onClick={onDismiss}
      >
        <X />
      </Button>
    </div>
  );
}
