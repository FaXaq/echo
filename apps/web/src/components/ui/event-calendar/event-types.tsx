import { Ban, Calendar, GraduationCap, Music2, Ticket, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EventType } from "./types"
import { match } from "ts-pattern"

export const getEventLabel = (type: EventType | null) =>
  match(type)
    .with(null, () => "Event")
    .with("unavailability", () => "Unavailability")
    .with("rehearsal", () => "Rehearsal")
    .with("concert", () => "Concert")
    .with("meeting", () => "Meeting")
    .with("class", () => "Class")
    .exhaustive()



export function EventTypeIcon({ type, className }: { type: EventType | null; className?: string }) {
  return match(type)
    .with(null, () => <Calendar className={cn("shrink-0", className)} />)
    .with("class", () => <GraduationCap className={cn("shrink-0", className)} />)
    .with("unavailability", () => <Ban className={cn("shrink-0", className)} />)
    .with("rehearsal", () => <Music2 className={cn("shrink-0", className)} />)
    .with("concert", () => <Ticket className={cn("shrink-0", className)} />)
    .with("meeting", () => <Users className={cn("shrink-0", className)} />)
    .exhaustive();
}
