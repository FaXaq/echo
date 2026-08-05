import { Ban, GraduationCap, Music2, Ticket, Users, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EventType } from "./types"

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  unavailability: "Unavailability",
  rehearsal: "Rehearsal",
  concert: "Concert",
  meeting: "Meeting",
  class: "Class",
}

export const EVENT_TYPE_ICONS: Record<EventType, LucideIcon> = {
  unavailability: Ban,
  rehearsal: Music2,
  concert: Ticket,
  meeting: Users,
  class: GraduationCap,
}

export function EventTypeIcon({ type, className }: { type: EventType; className?: string }) {
  const Icon = EVENT_TYPE_ICONS[type]
  return <Icon className={cn("shrink-0", className)} />
}
