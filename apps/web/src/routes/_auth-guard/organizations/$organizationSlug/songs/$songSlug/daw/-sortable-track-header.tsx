import type React from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import { DawTrackHeader, type DawTrackHeaderProps } from "./-daw-track-header";
import { TRACK_HEIGHT } from "./-constants";

type SortableTrackHeaderProps = Omit<DawTrackHeaderProps, "handleRef"> & {
  index: number;
};

export function SortableTrackHeader({ index, track, ...props }: SortableTrackHeaderProps) {
  const { ref, handleRef, isDragging } = useSortable({ id: track.id, index });

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      style={{ height: TRACK_HEIGHT, opacity: isDragging ? 0.5 : 1 }}
    >
      <DawTrackHeader track={track} handleRef={handleRef} {...props} />
    </div>
  );
}
