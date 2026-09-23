import { useSortable } from "@dnd-kit/react/sortable";
import { useLingui } from "@lingui/react/macro";
import { MapPin, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { OutreachCard as OutreachCardData } from "@/services/resources/outreach";
import { Blobatar } from "@/ui/blobatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";

export interface OutreachCardProps {
  card: OutreachCardData;
  columnId: string;
  index: number;
  onClick: () => void;
  onEdit: () => void;
}

export function OutreachCardPreview({ card, columnId, index, onClick, onEdit }: OutreachCardProps) {
  const { t } = useLingui();
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
        <div className="flex flex-row justify-between gap-1">
          <p className="text-sm font-medium m-0">{card.title}</p>
          <div className="flex shrink-0 items-center gap-1">
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t`Card actions`}
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              >
                <MoreVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  {t`Edit`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
