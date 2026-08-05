import { useCallback, useState, type RefObject } from "react"
import dayjs from "dayjs"

import { pixelOffsetToMinutes } from "./helpers"

interface UseEventResizeOptions {
  disabled?: boolean
  containerRef: RefObject<HTMLElement | null>
  day: Date
  onResizeEnd?: (newEndDate: Date) => void
}

export function useEventResize({
  disabled,
  containerRef,
  day,
  onResizeEnd,
}: UseEventResizeOptions) {
  const [isResizing, setIsResizing] = useState(false)
  const [previewEndDate, setPreviewEndDate] = useState<Date | null>(null)

  const computeDateFromPointer = useCallback(
    (clientY: number) => {
      const container = containerRef.current
      if (!container) return null
      const rect = container.getBoundingClientRect()
      const minutes = pixelOffsetToMinutes(clientY - rect.top, rect.height)
      return dayjs(day).startOf("day").add(minutes, "minute").toDate()
    },
    [containerRef, day]
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const date = computeDateFromPointer(event.clientY)
      if (date) setPreviewEndDate(date)
    },
    [computeDateFromPointer]
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)

      const date = computeDateFromPointer(event.clientY)
      setIsResizing(false)
      setPreviewEndDate(null)
      if (date) onResizeEnd?.(date)
    },
    [computeDateFromPointer, handlePointerMove, onResizeEnd]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled || event.button !== 0) return
      event.stopPropagation()
      setIsResizing(true)
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
    },
    [disabled, handlePointerMove, handlePointerUp]
  )

  return {
    isResizing,
    previewEndDate,
    resizeHandleProps: { onPointerDown: handlePointerDown },
  }
}
