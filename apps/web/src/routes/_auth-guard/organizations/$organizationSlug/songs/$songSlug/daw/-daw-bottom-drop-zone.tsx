import { TRACK_HEIGHT } from "./-constants";

interface DawBottomDropZoneProps {
  visible: boolean;
}

export function DawBottomDropZone({ visible }: DawBottomDropZoneProps) {
  if (!visible) return null;

  return (
    <div
      className="relative border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center"
      style={{ height: TRACK_HEIGHT }}
    >
      <span className="text-sm font-medium text-primary">Drop to create new track</span>
    </div>
  );
}
