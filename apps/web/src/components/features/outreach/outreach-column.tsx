import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useLingui } from "@lingui/react/macro";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  OutreachCard as OutreachCardData,
  OutreachColumn as OutreachColumnData,
} from "@/services/resources/outreach";
import { OutreachCardPreview } from "./outreach-card";

export interface OutreachColumnProps {
  column: OutreachColumnData;
  index: number;
  cardIds: string[];
  cardsById: Map<string, OutreachCardData>;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddCard: () => void;
  onCardClick: (card: OutreachCardData) => void;
  onCardEdit: (card: OutreachCardData) => void;
}

export function OutreachColumnView({
  column,
  index,
  cardIds,
  cardsById,
  onRename,
  onDelete,
  onAddCard,
  onCardClick,
  onCardEdit,
}: OutreachColumnProps) {
  const { t } = useLingui();
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref, isDragging } = useSortable({
    id: column.id,
    index,
    group: "board",
    type: "column",
    accept: ["column", "card"],
    handle: handleRef,
  });

  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(column.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const commitRename = () => {
    setIsRenaming(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== column.name) onRename(trimmed);
    else setName(column.name);
  };

  const canDelete = cardIds.length === 0;

  return (
    <div
      ref={ref}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-muted/50 p-2 transition-opacity",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-center gap-1 px-1">
        <button
          ref={handleRef}
          type="button"
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label={t`Reorder column`}
        >
          <GripVertical className="size-4" />
        </button>
        {isRenaming ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setName(column.name);
                setIsRenaming(false);
              }
            }}
            className="h-7 flex-1 text-sm font-medium"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsRenaming(true)}
            className="flex-1 truncate rounded px-1 py-0.5 text-left text-sm font-medium hover:bg-muted"
          >
            {column.name}
          </button>
        )}
        <span className="text-xs text-muted-foreground">{cardIds.length}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={!canDelete}
          title={canDelete ? t`Delete column` : t`Move or delete this column's cards first`}
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="flex min-h-2 flex-col gap-2">
        {cardIds.map((cardId, cardIndex) => {
          const card = cardsById.get(cardId);
          if (!card) return null;
          return (
            <OutreachCardPreview
              key={cardId}
              card={card}
              columnId={column.id}
              index={cardIndex}
              onClick={() => onCardClick(card)}
              onEdit={() => onCardEdit(card)}
            />
          );
        })}
      </div>

      <Button type="button" variant="ghost" size="sm" className="justify-start" onClick={onAddCard}>
        <Plus />
        {t`Add card`}
      </Button>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t`Delete column?`}
        description={t`This will permanently delete "${column.name}". This action cannot be undone.`}
        confirmLabel={t`Delete`}
        variant="destructive"
        onConfirm={onDelete}
      />
    </div>
  );
}
