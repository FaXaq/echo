import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import type * as React from "react"

import { Button } from "@/components/ui/button"
import {
  MediaReadyState,
  usePlaybackStore,
} from "@/hooks/limeplay/use-playback"
import { useVolumeStore } from "@/hooks/limeplay/use-volume"

export interface MuteControlProps extends useRender.ComponentProps<"button"> {
  shortcut?: string
}

export type MuteControlPropsDocs = Pick<
  MuteControlProps,
  "render" | "shortcut"
>

export function MuteControl(props: MuteControlProps) {
  const readyState = usePlaybackStore((state) => state.readyState)
  const muted = useVolumeStore((state) => state.muted)
  const toggleMute = useVolumeStore((state) => state.toggleMute)

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
      toggleMute()
    }
  }

  const isDisabled = readyState < MediaReadyState.HAVE_METADATA || userDisabled

  const getDefaultAriaLabel = () => {
    const shortcutText = shortcut ? ` (keyboard shortcut ${shortcut})` : ""
    const label = muted ? "Unmute" : "Mute"
    return `${label}${shortcutText}`
  }

  return useRender({
    render: render ?? <Button />,
    props: {
      "data-label": "lp-mute-control",
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
