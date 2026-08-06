"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import type * as React from "react"

import { Button } from "@/components/ui/button"
import { usePictureInPictureStore } from "@/hooks/limeplay/use-picture-in-picture"
import {
  MediaReadyState,
  usePlaybackStore,
} from "@/hooks/limeplay/use-playback"

export interface PictureInPictureControlProps extends useRender.ComponentProps<"button"> {
  /**
   * Keyboard shortcut hint displayed in aria-label
   * @example "P"
   */
  shortcut?: string
}

export type PictureInPictureControlPropsDocs = Pick<
  PictureInPictureControlProps,
  "render" | "shortcut"
>

export function PictureInPictureControl(props: PictureInPictureControlProps) {
  const readyState = usePlaybackStore((state) => state.readyState)
  const isPictureInPictureActive = usePictureInPictureStore(
    (state) => state.active
  )
  const isPictureInPictureSupported = usePictureInPictureStore(
    (state) => state.supported
  )
  const toggle = usePictureInPictureStore((state) => state.toggle)

  const {
    "aria-label": ariaLabelProp,
    disabled: userDisabled,
    onClick,
    render,
    shortcut,
    ...restProps
  } = props

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (!event.defaultPrevented) {
      await toggle()
    }
  }

  const isDisabled =
    readyState < MediaReadyState.HAVE_METADATA ||
    !isPictureInPictureSupported ||
    userDisabled

  const getDefaultAriaLabel = () => {
    const shortcutText = shortcut ? ` (keyboard shortcut ${shortcut})` : ""
    const label = isPictureInPictureActive
      ? "Exit Picture-in-Picture"
      : "Enter Picture-in-Picture"
    return `${label}${shortcutText}`
  }

  return useRender({
    render: render ?? <Button />,
    props: {
      "data-label": "lp-picture-in-picture-control",
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
