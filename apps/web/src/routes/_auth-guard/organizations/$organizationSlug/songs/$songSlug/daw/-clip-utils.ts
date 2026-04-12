/**
 * Pure clip and geometry utility functions.
 * No React, no tRPC — importable in any context including unit tests.
 */

import { RULER_HEIGHT, TRACK_HEIGHT } from "./-constants";
import type { Track } from "./-daw-types";

/**
 * Strip file extension from a filename.
 */
export function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

/**
 * Compute the ghost clip position from a drag event over the timeline container.
 * Returns null if the cursor is over the ruler or there are no tracks.
 */
export function computeGhostPosition(
  e: React.DragEvent<HTMLDivElement>,
  container: HTMLDivElement,
  tracks: Track[],
  pixelsPerMeasure: number,
): { trackIndex: number; startMeasure: number } | null {
  if (tracks.length === 0) return null;
  const rect = container.getBoundingClientRect();
  const pixelY = e.clientY - rect.top;
  if (pixelY < RULER_HEIGHT) return null;
  const pixelX = e.clientX - rect.left + container.scrollLeft;
  const startMeasure = Math.max(1, Math.round((pixelX / pixelsPerMeasure) * 4) / 4);
  const trackIndex = Math.max(
    0,
    Math.min(tracks.length - 1, Math.floor((pixelY - RULER_HEIGHT) / TRACK_HEIGHT)),
  );
  return { trackIndex, startMeasure };
}

/**
 * Compute all overlapping pixel regions between a set of clip rects.
 */
export function computeOverlaps(
  clipRegions: Array<{ left: number; width: number }>,
): Array<{ left: number; width: number }> {
  if (clipRegions.length < 2) return [];

  const overlaps: Array<{ left: number; width: number }> = [];

  for (let i = 0; i < clipRegions.length; i++) {
    for (let j = i + 1; j < clipRegions.length; j++) {
      const clip1 = clipRegions[i];
      const clip2 = clipRegions[j];

      const overlapLeft = Math.max(clip1.left, clip2.left);
      const overlapRight = Math.min(clip1.left + clip1.width, clip2.left + clip2.width);

      if (overlapLeft < overlapRight) {
        overlaps.push({ left: overlapLeft, width: overlapRight - overlapLeft });
      }
    }
  }

  return overlaps;
}

/**
 * Compute the snapped measure position for a clip drag operation.
 * Returns the nearest quarter-measure position (snapped to 0.25 increments).
 */
export function computeSnappedMeasure(
  mouseX: number,
  scrollLeft: number,
  startX: number,
  initialScrollLeft: number,
  originalMeasure: number,
  pixelsPerMeasure: number,
): number {
  const dx = mouseX - startX + scrollLeft - initialScrollLeft;
  return Math.round(Math.max(1, originalMeasure + dx / pixelsPerMeasure) * 4) / 4;
}

/**
 * Compute the rendered pixel width of a clip on the timeline.
 */
export function computeClipWidthPx(
  durationMs: number | undefined,
  secondsPerMeasure: number,
  pixelsPerMeasure: number,
): number {
  return Math.max(
    pixelsPerMeasure,
    durationMs != null
      ? (durationMs / 1000 / secondsPerMeasure) * pixelsPerMeasure
      : pixelsPerMeasure,
  );
}
