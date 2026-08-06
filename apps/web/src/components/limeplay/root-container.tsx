"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import React from "react"

import { cn, mergeRefs } from "@/lib/utils"
import { useMediaStore } from "@/hooks/limeplay/use-media"
import { usePlaybackStore } from "@/hooks/limeplay/use-playback"
import { usePlayerStore } from "@/hooks/limeplay/use-player"

export interface RootContainerProps extends useRender.ComponentProps<"div"> {
  /**
   * Aspect ratio for the player root. Pass false for players that should size
   * from their content, such as compact audio controls.
   */
  aspectRatio?: false | number | string
  /**
   * Height in pixels for aspect ratio calculation.
   * Used only if aspectRatio prop is not provided.
   */
  height?: number
  /**
   * Width in pixels for aspect ratio calculation.
   * Used only if aspectRatio prop is not provided.
   */
  width?: number
}

export type RootContainerPropsDocs = Pick<
  RootContainerProps,
  "aspectRatio" | "height" | "render" | "width"
>

export function RootContainer(props: RootContainerProps) {
  const {
    aspectRatio: aspectRatioProp,
    className,
    height = 1080,
    render,
    ref,
    style,
    width = 1920,
    ...etc
  } = props
  const idle = useMediaStore((state) => state.idle)
  const forceIdle = useMediaStore((state) => state.forceIdle)
  const status = usePlaybackStore((state) => state.status)
  const debug = useMediaStore((state) => state.debug)

  const setPlayerContainerRef = usePlayerStore((state) => state.setContainerRef)
  const aspectRatio = React.useMemo(
    () => resolveAspectRatio(aspectRatioProp, width, height),
    [aspectRatioProp, height, width]
  )
  const composedRef = React.useMemo(
    () => mergeRefs(ref, setPlayerContainerRef),
    [ref, setPlayerContainerRef]
  )

  return useRender({
    defaultTagName: "div",
    ref: composedRef,
    render,
    props: {
      "data-idle": debug || forceIdle ? "false" : idle,
      "data-layout-type": "root-container",
      "data-status": status,
      ...mergeProps<"div">(
        {
          "aria-label": "Media player",
          className: cn(
            `
              group/root @container/root
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50
            `,
            aspectRatio ? "aspect-(--aspect-ratio)" : "",
            className
          ),
          role: "region",
          style: {
            ...style,
            ["--aspect-ratio" as string]: aspectRatio,
            ["--height" as string]: height,
            ["--width" as string]: width,
          },
        },
        etc
      ),
    },
  })
}

function calculateAspectRatio(width?: number, height?: number) {
  if (width && height) {
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b)
    }
    const divisor = gcd(width, height)
    const aspectWidth = width / divisor
    const aspectHeight = height / divisor
    return `${aspectWidth}:${aspectHeight}`
  }
}

function resolveAspectRatio(
  aspectRatio: false | number | string | undefined,
  width?: number,
  height?: number
) {
  if (aspectRatio === false) return undefined
  if (typeof aspectRatio === "number") return String(aspectRatio)
  if (typeof aspectRatio === "string") {
    return aspectRatio.split(":").join("/")
  }

  return calculateAspectRatio(width, height)?.split(":").join("/")
}
