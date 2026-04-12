import { Trans } from "react-i18next";
import { useTranslation } from "react-i18next";
import { PIXELS_PER_MEASURE, STRUCTURE_LANE_HEIGHT } from "./-constants";

const CHORD_HIDE_WIDTH_PX = 60;
const NEUTRAL_COLOR = "#6b7280";

type Chord = { at: number; chord: string };

export type SectionInstanceWithDefinition = {
  id: string;
  startMeasure: number;
  lengthMeasures: number;
  definition: {
    name: string;
    color: string | null;
    chords: Chord[];
  };
};

interface DawStructureLaneProps {
  instances: SectionInstanceWithDefinition[];
  totalWidth: number;
}

export function DawStructureLane({ instances, totalWidth }: DawStructureLaneProps) {
  if (instances.length === 0) return null;

  return (
    <div
      className="relative border-b bg-muted/30"
      style={{ height: STRUCTURE_LANE_HEIGHT, width: totalWidth }}
    >
      {instances.map((instance) => {
        const leftPx = (instance.startMeasure - 1) * PIXELS_PER_MEASURE;
        const widthPx = instance.lengthMeasures * PIXELS_PER_MEASURE;
        const color = instance.definition.color ?? NEUTRAL_COLOR;
        const chordLine =
          instance.definition.chords.length > 0
            ? instance.definition.chords.map((c) => c.chord).join(" · ")
            : null;
        const showChords = widthPx >= CHORD_HIDE_WIDTH_PX && chordLine !== null;

        return (
          <div
            key={instance.id}
            className="absolute inset-y-1 rounded pointer-events-none flex flex-col justify-center px-2 overflow-hidden"
            style={{
              left: leftPx,
              width: widthPx - 2,
              backgroundColor: `${color}33`,
              borderLeft: `3px solid ${color}`,
            }}
          >
            <span className="text-xs font-medium leading-none truncate" style={{ color }}>
              {instance.definition.name}
            </span>
            {showChords && (
              <span className="text-xs leading-none truncate text-muted-foreground mt-0.5 font-mono">
                {chordLine}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface DawStructureLaneHeaderProps {
  visible: boolean;
}

export function DawStructureLaneHeader({ visible }: DawStructureLaneHeaderProps) {
  const { t } = useTranslation("songs");

  if (!visible) return null;

  return (
    <div
      className="border-b px-2 flex items-center"
      style={{ height: STRUCTURE_LANE_HEIGHT }}
    >
      <span className="text-xs font-medium text-muted-foreground select-none">
        <Trans t={t}>Structure</Trans>
      </span>
    </div>
  );
}
