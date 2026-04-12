import { Trans } from "react-i18next";
import { useTranslation } from "react-i18next";
import { PIXELS_PER_MEASURE, STRUCTURE_LANE_HEIGHT } from "./-constants";

const CHORD_HIDE_WIDTH_PX = 60;

const PRESET_COLORS = [
  "#7C3AED", "#2563EB", "#059669", "#D97706",
  "#DC2626", "#DB2777", "#0891B2", "#65A30D",
];

function colorForIndex(index: number): string {
  return PRESET_COLORS[index % PRESET_COLORS.length];
}

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

  // Assign a consistent fallback color per definition (by order of first appearance)
  const definitionColors = new Map<string, string>();
  for (const instance of instances) {
    if (!definitionColors.has(instance.definition.id)) {
      definitionColors.set(
        instance.definition.id,
        instance.definition.color ?? colorForIndex(definitionColors.size),
      );
    }
  }

  return (
    <div
      className="relative border-b bg-muted/30"
      style={{ height: STRUCTURE_LANE_HEIGHT, width: totalWidth }}
    >
      {instances.map((instance) => {
        const leftPx = (instance.startMeasure - 1) * PIXELS_PER_MEASURE;
        const widthPx = instance.lengthMeasures * PIXELS_PER_MEASURE;
        const color = definitionColors.get(instance.definition.id)!;
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
