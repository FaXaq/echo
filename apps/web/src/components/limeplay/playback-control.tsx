import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import type * as React from "react"

import { Button } from "@/components/ui/button"
import {
  MediaReadyState,
  usePlaybackStore,
} from "@/hooks/limeplay/use-playback"

interface PlaybackControlProps extends useRender.ComponentProps<"button"> {
  /**
   * Keyboard shortcut hint displayed in aria-label
   * @example "Space"
   */
  shortcut?: string
}

export function PlaybackControl(props: PlaybackControlProps) {
  const status = usePlaybackStore((state) => state.status)
  const readyState = usePlaybackStore((state) => state.readyState)
  const togglePaused = usePlaybackStore((state) => state.togglePaused)

  const {
    "aria-label": ariaLabelProp,
    disabled: userDisabled,
    onClick,
    render,
    shortcut,
    ...restProps
  } = props

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (!event.defaultPrevented) {
      togglePaused()
    }
  }

  const isDisabled =
    readyState < MediaReadyState.HAVE_CURRENT_DATA || userDisabled

  const getDefaultAriaLabel = () => {
    const shortcutText = shortcut ? ` (keyboard shortcut ${shortcut})` : ""
    const labels = {
      default: "Play",
      ended: "Replay",
      playing: "Pause",
    }

    const label =
      status === "ended"
        ? labels.ended
        : status === "playing"
          ? labels.playing
          : labels.default
    return `${label}${shortcutText}`
  }

  return useRender({
    render: render ?? <Button />,
    props: {
      "data-label": "lp-playback-control",
      ...mergeProps<"button">(
        {
          "aria-keyshortcuts": shortcut,
          "aria-label": ariaLabelProp ?? getDefaultAriaLabel(),
          disabled: isDisabled,
          onClick: handleClick,
        },
        restProps
      ),
    },
  })
}
