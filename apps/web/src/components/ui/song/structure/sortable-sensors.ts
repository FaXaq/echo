import { KeyboardSensor, PointerSensor } from "@dnd-kit/react";

export const SORTABLE_SENSORS = [
  PointerSensor.configure({
    preventActivation: (event) => event.target instanceof HTMLInputElement,
  }),
  KeyboardSensor,
];
