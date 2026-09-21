import { useSortable } from "@dnd-kit/react/sortable";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OutreachCard as OutreachCardData } from "@/services/resources/outreach";
import { Blobatar } from "@/ui/blobatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";

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
        <div className="flex flex-row justify-between">
          <p className="text-sm font-medium m-0">{card.title}</p>
          {card.assigneeName && (
            <Tooltip>
              <TooltipTrigger>
                <Blobatar
                  className="self-start"
                  name={card.assigneeName}
                  blobatar={{ animate: "always", traits: { shape: 0.11 } }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <span>{card.assigneeName}</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {card.place && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{card.place.name}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
