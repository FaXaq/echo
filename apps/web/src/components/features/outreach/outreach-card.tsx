import { useSortable } from "@dnd-kit/react/sortable";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OutreachCard as OutreachCardData } from "@/services/resources/outreach";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export interface OutreachCardProps {
  card: OutreachCardData;
  columnId: string;
  index: number;
  onClick: () => void;
}

export function OutreachCardPreview({ card, columnId, index, onClick }: OutreachCardProps) {
  const { ref, isDragging } = useSortable({
    id: card.id,
    index,
    group: columnId,
    type: "card",
    accept: "card",
  });

  return (
    <Card
      ref={ref}
      size="sm"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
      className={cn(
        "cursor-grab touch-none select-none transition-opacity active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <CardContent className="space-y-1.5">
        <p className="text-sm font-medium">{card.title}</p>
        {card.place && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{card.place.name}</span>
          </p>
        )}
        {card.assigneeName && (
          <Avatar size="xs" title={card.assigneeName}>
            <AvatarFallback>{initials(card.assigneeName)}</AvatarFallback>
          </Avatar>
        )}
      </CardContent>
    </Card>
  );
}
