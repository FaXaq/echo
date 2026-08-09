import { msg } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";
import type { EventColor } from "./types";

export const EVENT_COLORS: EventColor[] = ["blue", "green", "red", "yellow", "purple", "orange"];

export const eventColorClasses: Record<EventColor, string> = {
  blue: "bg-event-blue text-event-blue-foreground",
  green: "bg-event-green text-event-green-foreground",
  red: "bg-event-red text-event-red-foreground",
  yellow: "bg-event-yellow text-event-yellow-foreground",
  purple: "bg-event-purple text-event-purple-foreground",
  orange: "bg-event-orange text-event-orange-foreground",
};

export const eventDotClasses: Record<EventColor, string> = {
  blue: "bg-event-blue",
  green: "bg-event-green",
  red: "bg-event-red",
  yellow: "bg-event-yellow",
  purple: "bg-event-purple",
  orange: "bg-event-orange",
};

export const COLOR_LABELS: Record<EventColor, MessageDescriptor> = {
  blue: msg`Blue`,
  green: msg`Green`,
  red: msg`Red`,
  yellow: msg`Yellow`,
  purple: msg`Purple`,
  orange: msg`Orange`,
};
