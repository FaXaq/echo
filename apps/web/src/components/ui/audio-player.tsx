import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { computeWaveformPeaks } from "./audio-waveform"

const BUCKET_COUNT = 64

export interface AudioPlayerProps {
  src: string
  filename: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function AudioPlayer({ src, filename }: AudioPlayerProps) {
  const { t } = useTranslation("calendar")
  const audioRef = useRef<HTMLAudioElement>(null)
  const waveformRef = useRef<HTMLDivElement>(null)

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [peaks, setPeaks] = useState<number[]>([])
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    let cancelled = false
    let createdObjectUrl: string | null = null

    async function load() {
      setStatus("loading")
      setPeaks([])
      try {
        const response = await fetch(src)
        if (!response.ok) throw new Error("Failed to fetch audio")
        const arrayBuffer = await response.arrayBuffer()
        if (cancelled) return

        createdObjectUrl = URL.createObjectURL(new Blob([arrayBuffer]))
        setObjectUrl(createdObjectUrl)

        const AudioContextCtor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioContext = new AudioContextCtor()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        await audioContext.close()
        if (cancelled) return

        setPeaks(computeWaveformPeaks(audioBuffer.getChannelData(0), BUCKET_COUNT))
        setStatus("ready")
      } catch {
        if (!cancelled) setStatus("error")
      }
    }

    load()

    return () => {
      cancelled = true
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.pause()
    else audio.play()
  }

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const el = waveformRef.current
    if (!audio || !el || duration === 0) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">{t("Unable to preview waveform")}</p>
        <audio controls src={src} className="h-8 w-full" aria-label={filename} />
      </div>
    )
  }

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={status === "loading"}
        aria-label={isPlaying ? t("Pause") : t("Play")}
        onClick={togglePlay}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>

      <div
        ref={waveformRef}
        data-testid="audio-player-waveform"
        aria-label={filename}
        onClick={handleSeek}
        className="relative h-8 flex-1 cursor-pointer"
      >
        {status === "loading" ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <>
            <div className="flex h-full items-end gap-px">
              {peaks.map((peak, i) => (
                <span
                  key={i}
                  className="min-w-px flex-1 rounded-full bg-muted-foreground/30"
                  style={{ height: `${Math.max(peak * 100, 8)}%` }}
                />
              ))}
            </div>
            <div
              className="absolute inset-0 flex h-full items-end gap-px"
              style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}
            >
              {peaks.map((peak, i) => (
                <span
                  key={i}
                  className="min-w-px flex-1 rounded-full bg-primary"
                  style={{ height: `${Math.max(peak * 100, 8)}%` }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <span className="text-xs tabular-nums text-muted-foreground">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <audio
        ref={audioRef}
        src={objectUrl ?? undefined}
        className="hidden"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  )
}
