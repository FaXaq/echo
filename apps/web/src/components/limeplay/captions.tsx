import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import React, { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { cn, mergeRefs } from "@/lib/utils"
import {
  useCaptions,
  useCaptionsStore,
} from "@/hooks/limeplay/use-captions"
import { usePlayerStore } from "@/hooks/limeplay/use-player"

export interface CaptionsControlProps extends useRender.ComponentProps<"button"> {
  /**
   * Keyboard shortcut hint displayed in aria-label
   * @example "C"
   */
  shortcut?: string
}

export type CaptionsControlPropsDocs = Pick<
  CaptionsControlProps,
  "render" | "shortcut"
>

export function CaptionsControl(props: CaptionsControlProps) {
  const textTracks = useCaptionsStore((state) => state.tracks)
  const { toggleVisibility } = useCaptions()

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
      toggleVisibility()
    }
  }

  const isDisabled = !textTracks || textTracks.length === 0 || userDisabled

  const getDefaultAriaLabel = () => {
    const shortcutText = shortcut ? ` (keyboard shortcut ${shortcut})` : ""
    return `Captions${shortcutText}`
  }

  return useRender({
    render: render ?? <Button />,
    props: {
      "data-label": "lp-captions-control",
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

export type CaptionsContainerPropsDocs = Pick<
  CaptionsContainerProps,
  "fontScale"
>

interface CaptionsContainerProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * Font scale factor for caption text size
   * @default 1
   */
  fontScale?: number
}

export const CaptionsContainer = React.forwardRef<
  HTMLDivElement,
  CaptionsContainerProps
>((props, ref) => {
  const { className, fontScale, ...etc } = props
  const player = usePlayerStore((state) => state.instance)
  const setContainerElement = useCaptionsStore(
    (state) => state.setContainerElement
  )

  useEffect(() => {
    if (player && fontScale) {
      player.configure({
        textDisplayer: {
          fontScaleFactor: fontScale,
        },
      })
    }
  }, [player, fontScale])

  const composedRef = React.useMemo(
    () => mergeRefs(ref, setContainerElement),
    [ref, setContainerElement]
  )

  return (
    <div
      className={cn(
        "relative flex w-full grow flex-col justify-end text-lg",
        className
      )}
      ref={composedRef}
      {...etc}
    />
  )
})

CaptionsContainer.displayName = "CaptionsContainer"
