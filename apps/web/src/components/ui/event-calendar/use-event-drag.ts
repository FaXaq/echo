import { useCallback, useRef, useState } from "react"

const DRAG_THRESHOLD_PX = 4

export interface DragTarget {
  day: string
  minutes?: number
}

interface UseEventDragOptions {
  disabled?: boolean
  onClick?: () => void
  onDrop?: (target: DragTarget) => void
}

function readDropTarget(element: Element | null): DragTarget | null {
  const target = element?.closest<HTMLElement>("[data-drop-day]")
  const day = target?.dataset.dropDay
  if (!day) return null
  const minutes = target?.dataset.dropMinutes
  return { day, minutes: minutes ? Number(minutes) : undefined }
}

export function useEventDrag({
  disabled,
  onClick,
  onDrop,
}: UseEventDragOptions) {
  const [isDragging, setIsDragging] = useState(false)
  const [activeTarget, setActiveTarget] = useState<DragTarget | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const draggingRef = useRef(false)

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!startPos.current) return
    const dx = event.clientX - startPos.current.x
    const dy = event.clientY - startPos.current.y

    if (!draggingRef.current && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      draggingRef.current = true
      setIsDragging(true)
    }

    if (draggingRef.current) {
      setActiveTarget(
        readDropTarget(document.elementFromPoint(event.clientX, event.clientY))
      )
    }
  }, [])

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)

      if (draggingRef.current) {
        const target = readDropTarget(
          document.elementFromPoint(event.clientX, event.clientY)
        )
        if (target) onDrop?.(target)
      } else {
        onClick?.()
      }

      draggingRef.current = false
      startPos.current = null
      setIsDragging(false)
      setActiveTarget(null)
    },
    [handlePointerMove, onClick, onDrop]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled || event.button !== 0) return
      startPos.current = { x: event.clientX, y: event.clientY }
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
    },
    [disabled, handlePointerMove, handlePointerUp]
  )

  return {
    isDragging,
    activeTarget,
    dragHandlers: { onPointerDown: handlePointerDown },
  }
}
