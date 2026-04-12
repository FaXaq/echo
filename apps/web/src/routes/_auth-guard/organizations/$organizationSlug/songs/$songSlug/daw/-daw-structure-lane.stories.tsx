import type { Meta, StoryObj } from "@storybook/react";
import { DawStructureLane } from "./-daw-structure-lane";
import { PIXELS_PER_MEASURE } from "./-constants";

const TOTAL_WIDTH = 32 * PIXELS_PER_MEASURE;

const meta = {
  title: "DAW/StructureLane",
  component: DawStructureLane,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DawStructureLane>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    instances: [],
    totalWidth: TOTAL_WIDTH,
  },
};

export const SingleInstanceWithChords: Story = {
  args: {
    totalWidth: TOTAL_WIDTH,
    instances: [
      {
        id: "inst-1",
        startMeasure: 1,
        lengthMeasures: 8,
        definition: {
          name: "Verse",
          color: "#2563EB",
          chords: [
            { at: 1.0, chord: "Am" },
            { at: 1.5, chord: "G" },
            { at: 2.0, chord: "F" },
            { at: 2.5, chord: "C" },
          ],
        },
      },
    ],
  },
};

export const MultipleInstancesMixedColors: Story = {
  args: {
    totalWidth: TOTAL_WIDTH,
    instances: [
      {
        id: "inst-1",
        startMeasure: 1,
        lengthMeasures: 4,
        definition: {
          name: "Intro",
          color: "#7C3AED",
          chords: [{ at: 1.0, chord: "Em" }, { at: 2.0, chord: "C" }],
        },
      },
      {
        id: "inst-2",
        startMeasure: 5,
        lengthMeasures: 8,
        definition: {
          name: "Verse",
          color: "#2563EB",
          chords: [{ at: 1.0, chord: "Am" }, { at: 2.0, chord: "G" }, { at: 3.0, chord: "F" }, { at: 4.0, chord: "C" }],
        },
      },
      {
        id: "inst-3",
        startMeasure: 13,
        lengthMeasures: 8,
        definition: {
          name: "Chorus",
          color: "#DC2626",
          chords: [{ at: 1.0, chord: "C" }, { at: 2.0, chord: "G" }, { at: 3.0, chord: "Am" }, { at: 4.0, chord: "F" }],
        },
      },
      {
        id: "inst-4",
        startMeasure: 21,
        lengthMeasures: 8,
        definition: {
          name: "Verse",
          color: "#2563EB",
          chords: [{ at: 1.0, chord: "Am" }, { at: 2.0, chord: "G" }, { at: 3.0, chord: "F" }, { at: 4.0, chord: "C" }],
        },
      },
    ],
  },
};

// Block too narrow to show chords (1 measure = 120px, below threshold of 60px would require < 0.5 measure;
// use a 0-color scenario and short length to illustrate the name-only render)
export const NarrowBlockChordsHidden: Story = {
  args: {
    totalWidth: TOTAL_WIDTH,
    instances: [
      {
        id: "inst-narrow",
        startMeasure: 1,
        lengthMeasures: 0.4,
        definition: {
          name: "Fill",
          color: "#059669",
          chords: [{ at: 1.0, chord: "G" }],
        },
      },
      {
        id: "inst-wide",
        startMeasure: 3,
        lengthMeasures: 6,
        definition: {
          name: "Bridge",
          color: "#D97706",
          chords: [{ at: 1.0, chord: "Bm" }, { at: 2.0, chord: "A" }, { at: 3.0, chord: "G" }],
        },
      },
    ],
  },
};
