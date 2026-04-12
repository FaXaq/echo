import { useState, useRef, useCallback } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { useDawContext } from "../-daw-context";
import type { SectionInstanceWithDefinition } from "../-daw-structure-lane";

interface UseStructureLaneResizeDeps {
  instances: SectionInstanceWithDefinition[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  songId: string;
}

interface DragState {
  instanceId: string;
  startX: number;
  capturedScrollLeft: number;
  originalLength: number;
}

function rebuildWithRipple(
  sorted: SectionInstanceWithDefinition[],
  instanceId: string,
  newLength: number,
): SectionInstanceWithDefinition[] {
  const idx = sorted.findIndex((i) => i.id === instanceId);
  if (idx === -1) return sorted;
  const updated = [...sorted];
  updated[idx] = { ...updated[idx], lengthMeasures: newLength };
  for (let i = idx + 1; i < updated.length; i++) {
    updated[i] = {
      ...updated[i],
      startMeasure: updated[i - 1].startMeasure + updated[i - 1].lengthMeasures,
    };
  }
  return updated;
}

export function useStructureLaneResize({
  instances,
  scrollContainerRef,
  songId,
}: UseStructureLaneResizeDeps) {
  const { pixelsPerMeasure } = useDawContext();
  const utils = trpc.useUtils();

  const [optimisticInstances, setOptimisticInstances] = useState<SectionInstanceWithDefinition[] | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const originalInstancesRef = useRef<SectionInstanceWithDefinition[]>([]);
  const optimisticRef = useRef<SectionInstanceWithDefinition[] | null>(null);

  // Keep ref in sync for access inside event handlers
  optimisticRef.current = optimisticInstances;

  const updateInstance = trpc.organization.song.section.instance.update.useMutation({
    onSuccess: () => utils.organization.song.section.instance.list.invalidate({ songId }),
  });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStateRef.current) return;
      const { instanceId, startX, capturedScrollLeft, originalLength } = dragStateRef.current;
      const currentScrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;
      const dx = e.clientX - startX + currentScrollLeft - capturedScrollLeft;
      const newLength = Math.max(0.25, Math.round((originalLength + dx / pixelsPerMeasure) * 4) / 4);
      const sorted = [...originalInstancesRef.current].sort((a, b) => a.startMeasure - b.startMeasure);
      const next = rebuildWithRipple(sorted, instanceId, newLength);
      optimisticRef.current = next;
      setOptimisticInstances(next);
    },
    [pixelsPerMeasure, scrollContainerRef],
  );

  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current) return;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    const optimistic = optimisticRef.current;
    const original = originalInstancesRef.current;

    if (optimistic) {
      optimistic.forEach((opt) => {
        const orig = original.find((o) => o.id === opt.id);
        if (
          orig &&
          (opt.lengthMeasures !== orig.lengthMeasures || opt.startMeasure !== orig.startMeasure)
        ) {
          updateInstance.mutate({
            id: opt.id,
            lengthMeasures: opt.lengthMeasures,
            startMeasure: opt.startMeasure,
          });
        }
      });
    }

    dragStateRef.current = null;
    optimisticRef.current = null;
    setOptimisticInstances(null);
  }, [handleMouseMove, updateInstance]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, instance: SectionInstanceWithDefinition) => {
      e.preventDefault();
      e.stopPropagation();
      originalInstancesRef.current = [...instances];
      dragStateRef.current = {
        instanceId: instance.id,
        startX: e.clientX,
        capturedScrollLeft: scrollContainerRef.current?.scrollLeft ?? 0,
        originalLength: instance.lengthMeasures,
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [instances, scrollContainerRef, handleMouseMove, handleMouseUp],
  );

  return {
    optimisticInstances,
    onResizeStart,
  };
}
