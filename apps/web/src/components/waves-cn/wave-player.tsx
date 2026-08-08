"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent } from "@/components/ui/popover";
import {
  Play,
  Pause,
  Volume1,
  Volume2,
  VolumeX,
  Loader2,
  RotateCcw,
  FileWarning,
} from "lucide-react";
import WavesurferPlayer from "@/lib/wave-cn";
import type WaveSurfer from "wavesurfer.js";
import { ButtonGroup } from "@/ui/button-group";

export interface WavePlayerProps {
  /** Audio source URL */
  src: string;
  /** Optional title shown above the waveform */
  title: string;
  /** Initial volume (0–1) */
  defaultVolume?: number;
  /** Audio bar color. Accepts any CSS value including var(--*) tokens @default "var(--muted-foreground)" */
  waveColor?: string;
  /** Progress bar color. Accepts any CSS value including var(--*) tokens @default "var(--primary)" */
  progressColor?: string;
  /** Waveform bar width in px @default 3 */
  barWidth?: number;
  /** Waveform bar gap in px @default 2 */
  barGap?: number;
  /** Rounded borders for bars @default 2 */
  barRadius?: number;
  /** Waveform height in px @default 64 */
  waveHeight?: number;
  /** Minimum pixels per second (zoom level) @default 1 */
  minPxPerSec?: number;
  /** Autoplay on mount */
  autoPlay?: boolean;
  /** Called when playback starts */
  onPlay?: () => void;
  /** Called when playback pauses */
  onPause?: () => void;
  /** Called when playback finishes */
  onFinish?: () => void;
  /** Called with current time on every audio process tick */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** Called when the audio source fails to load, decode, or play */
  onError?: (error: Error) => void;
  /** Message shown in place of the player when the audio source fails to load */
  errorMessage?: string;
  className?: string;
}

function formatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WavePlayer({
  src,
  title,
  defaultVolume = 0.8,
  waveColor,
  progressColor,
  barWidth,
  barGap,
  barRadius,
  waveHeight,
  minPxPerSec,
  autoPlay = false,
  onPlay,
  onPause,
  onFinish,
  onTimeUpdate,
  onError,
  errorMessage = "Unable to load audio",
  className,
}: WavePlayerProps) {
  const wavesurferRef = React.useRef<WaveSurfer | null>(null);
  const volumeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const volumeCloseTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [isReady, setIsReady] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [volume, setVolume] = React.useState(defaultVolume);
  const [isMuted, setIsMuted] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);
  const [isVolumeSliderOpen, setIsVolumeSliderOpen] = React.useState(false);

  const openVolumeSlider = React.useCallback(() => {
    if (volumeCloseTimeoutRef.current) {
      clearTimeout(volumeCloseTimeoutRef.current);
      volumeCloseTimeoutRef.current = null;
    }
    setIsVolumeSliderOpen(true);
  }, []);

  const scheduleCloseVolumeSlider = React.useCallback(() => {
    volumeCloseTimeoutRef.current = setTimeout(() => {
      setIsVolumeSliderOpen(false);
    }, 150);
  }, []);

  React.useEffect(() => {
    return () => {
      if (volumeCloseTimeoutRef.current) {
        clearTimeout(volumeCloseTimeoutRef.current);
      }
    };
  }, []);

  const togglePlay = React.useCallback(
    () => wavesurferRef.current?.playPause(),
    [],
  );

  const restart = React.useCallback(() => {
    if (!wavesurferRef.current || !isReady) return;
    wavesurferRef.current.setTime(0);
    wavesurferRef.current.play();
  }, [isReady]);

  const handleVolume = React.useCallback((v: number | readonly number[]) => {
    const value = Array.isArray(v) ? v[0] : v;
    setVolume(value);
    setIsMuted(value === 0);
    wavesurferRef.current?.setVolume(value);
  }, []);

  const toggleMute = React.useCallback(() => {
    if (!wavesurferRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    wavesurferRef.current.setVolume(next ? 0 : volume);
  }, [isMuted, volume]);

  const handleSeek = React.useCallback(
    (v: number | readonly number[]) => {
      if (!wavesurferRef.current || !isReady) return;
      wavesurferRef.current.seekTo(Array.isArray(v) ? v[0] : v);
    },
    [isReady],
  );

  const handleReady = React.useCallback(
    (ws: WaveSurfer) => {
      wavesurferRef.current = ws;
      ws.setVolume(defaultVolume);
      if (autoPlay) ws.play();
      setDuration(ws.getDuration());
      setIsReady(true);
    },
    [defaultVolume, autoPlay],
  );

  const handlePlay = React.useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = React.useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleFinish = React.useCallback(
    (ws: WaveSurfer) => {
      setIsPlaying(false);
      onFinish?.();
    },
    [onFinish],
  );

  const handleTimeupdate = React.useCallback(
    (ws: WaveSurfer) => {
      const t = ws.getCurrentTime();
      setCurrentTime(t);
      onTimeUpdate?.(t, ws.getDuration());
    },
    [onTimeUpdate],
  );

  const handleSeeking = React.useCallback((ws: WaveSurfer) => {
    setCurrentTime(ws.getCurrentTime());
  }, []);

  const handleDestroy = React.useCallback(() => {
    wavesurferRef.current = null;
    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
  }, []);

  const handleError = React.useCallback(
    (_ws: WaveSurfer, error: Error) => {
      setHasError(true);
      setIsReady(false);
      onError?.(error);
    },
    [onError],
  );

  // ── Derived
  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // ── Render
  return (
    <div className={className}>
      {hasError ? (
        <div
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-destructive/10 text-xs text-destructive"
          style={{ height: waveHeight ?? 64 }}
        >
          <FileWarning className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      ) : (
        <>
          <div className="flex flex-row gap-2 items-center">
            <div className="flex flex-row gap-1.5">
              <ButtonGroup>
                <Button
                  size="icon-lg"
                  variant="secondary"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={!isReady}
                  onClick={restart}
                  aria-label="Restart"
                >
                  <RotateCcw size={15} />
                </Button>
                <Button
                  size="icon-lg"
                  variant="secondary"
                  disabled={!isReady}
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                </Button>
              </ButtonGroup>
            </div>
            <div className="w-full flex flex-col gap-1">
              <div className="relative w-full rounded-sm h-fit">
                {!isReady && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 backdrop-blur-[2px] h-fit">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                <WavesurferPlayer
                  url={src}
                  waveColor={waveColor}
                  progressColor={progressColor}
                  height={waveHeight}
                  barWidth={barWidth}
                  barGap={barGap}
                  barRadius={barRadius}
                  minPxPerSec={minPxPerSec}
                  dragToSeek
                  onReady={handleReady}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onFinish={handleFinish}
                  onTimeupdate={handleTimeupdate}
                  onSeeking={handleSeeking}
                  onDestroy={handleDestroy}
                  onError={handleError}
                />
              </div>

              <div className="flex flex-row items-center justify-between gap-2 text-muted-foreground">
                <span className="text-xs">
                  {title}
                </span>
                <div className="flex flex-row gap-1">
                  <span className="text-xs tabular-nums text-right shrink-0">
                    {formatTime(currentTime)}
                  </span>
                    :
                  <span className="text-xs tabular-nums shrink-0">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Button
                ref={volumeButtonRef}
                size="icon-lg"
                variant="secondary"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={toggleMute}
                onMouseEnter={openVolumeSlider}
                onMouseLeave={scheduleCloseVolumeSlider}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                <VolumeIcon size={15} />
              </Button>
              <Popover
                open={isVolumeSliderOpen}
                onOpenChange={setIsVolumeSliderOpen}
              >
                <PopoverContent
                  anchor={volumeButtonRef}
                  side="top"
                  sideOffset={8}
                  className="w-auto items-center p-2.5"
                  onMouseEnter={openVolumeSlider}
                  onMouseLeave={scheduleCloseVolumeSlider}
                >
                  <Slider
                    orientation="vertical"
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolume}
                    aria-label="Volume"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default WavePlayer;
