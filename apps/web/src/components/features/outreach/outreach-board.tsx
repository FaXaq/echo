import { useEffect, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useLingui } from "@lingui/react/macro";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  listOutreachCardsQueryOptions,
  listOutreachColumnsQueryOptions,
  useCreateOutreachColumnMutation,
  useDeleteOutreachColumnMutation,
  useMoveOutreachCardMutation,
  useRenameOutreachColumnMutation,
  useReorderOutreachColumnMutation,
  type OutreachCard,
  type OutreachColumn,
} from "@/services/resources/outreach";
import { OutreachCardDialog, type OutreachCardDialogState } from "./outreach-card-dialog";
import { OutreachColumnView } from "./outreach-column";

type CardOrder = Record<string, string[]>;

function buildOrder(columns: OutreachColumn[], cards: OutreachCard[]) {
  const cardOrder: CardOrder = Object.fromEntries(columns.map((column) => [column.id, []]));
  for (const card of [...cards].sort((a, b) => a.position - b.position)) {
    cardOrder[card.columnId]?.push(card.id);
  }
  const columnOrder = [...columns].sort((a, b) => a.position - b.position).map((c) => c.id);
  return { columnOrder, cardOrder };
}

export function OutreachBoard({ organizationId }: { organizationId: string }) {
  const { t } = useLingui();
  const { data: columns } = useSuspenseQuery(listOutreachColumnsQueryOptions({ organizationId }));
  const { data: cards } = useSuspenseQuery(listOutreachCardsQueryOptions({ organizationId }));

  const [{ columnOrder, cardOrder }, setOrder] = useState(() => buildOrder(columns, cards));
  const orderRef = useRef({ columnOrder, cardOrder });
  const dragSnapshotRef = useRef({ columnOrder, cardOrder });

  useEffect(() => {
    const next = buildOrder(columns, cards);
    orderRef.current = next;
    setOrder(next);
  }, [columns, cards]);

  const cardsById = new Map(cards.map((card) => [card.id, card]));

  const setColumnOrder = (updater: (prev: string[]) => string[]) => {
    const next = { ...orderRef.current, columnOrder: updater(orderRef.current.columnOrder) };
    orderRef.current = next;
    setOrder(next);
  };
  const setCardOrder = (updater: (prev: CardOrder) => CardOrder) => {
    const next = { ...orderRef.current, cardOrder: updater(orderRef.current.cardOrder) };
    orderRef.current = next;
    setOrder(next);
  };

  const createColumnMutation = useCreateOutreachColumnMutation();
  const renameColumnMutation = useRenameOutreachColumnMutation();
  const reorderColumnMutation = useReorderOutreachColumnMutation();
  const deleteColumnMutation = useDeleteOutreachColumnMutation();
  const moveCardMutation = useMoveOutreachCardMutation();

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [dialogState, setDialogState] = useState<OutreachCardDialogState>(null);

  const submitNewColumn = () => {
    const name = newColumnName.trim();
    setIsAddingColumn(false);
    setNewColumnName("");
    if (!name) return;
    createColumnMutation.mutate(
      { organizationId, name },
      { onError: () => toast.add({ title: t`Couldn't create column`, type: "error" }) },
    );
  };

  const persistCardMove = (cardId: string) => {
    const { cardOrder: finalOrder } = orderRef.current;
    const columnId = Object.keys(finalOrder).find((id) => finalOrder[id].includes(cardId));
    if (!columnId) return;
    const siblings = finalOrder[columnId];
    const cardIndex = siblings.indexOf(cardId);
    const beforeId = cardIndex > 0 ? siblings[cardIndex - 1] : null;
    const afterId = cardIndex < siblings.length - 1 ? siblings[cardIndex + 1] : null;

    moveCardMutation.mutate(
      { organizationId, id: cardId, columnId, beforeId, afterId },
      { onError: () => toast.add({ title: t`Couldn't move card`, type: "error" }) },
    );
  };

  const persistColumnMove = (columnId: string) => {
    const { columnOrder: finalOrder } = orderRef.current;
    const index = finalOrder.indexOf(columnId);
    const beforeId = index > 0 ? finalOrder[index - 1] : null;
    const afterId = index < finalOrder.length - 1 ? finalOrder[index + 1] : null;

    reorderColumnMutation.mutate(
      { organizationId, id: columnId, beforeId, afterId },
      { onError: () => toast.add({ title: t`Couldn't reorder column`, type: "error" }) },
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-3 min-h-0">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-medium">{t`Outreach`}</h1>
      </div>

      <DragDropProvider
        onDragStart={() => {
          dragSnapshotRef.current = orderRef.current;
        }}
        onDragOver={(event) => {
          const { source } = event.operation;
          if (source?.type === "card") {
            setCardOrder((prev) => move(prev, event));
          } else if (source?.type === "column") {
            setColumnOrder((prev) => move(prev, event));
          }
        }}
        onDragEnd={(event) => {
          const { source, canceled } = event.operation;
          if (canceled) {
            orderRef.current = dragSnapshotRef.current;
            setOrder(dragSnapshotRef.current);
            return;
          }
          if (!source) return;
          if (source.type === "card") persistCardMove(String(source.id));
          else if (source.type === "column") persistColumnMove(String(source.id));
        }}
      >
        <div className="flex flex-1 items-start gap-3 overflow-x-auto pb-2 min-h-0">
          {columnOrder.map((columnId, index) => {
            const column = columns.find((c) => c.id === columnId);
            if (!column) return null;
            return (
              <OutreachColumnView
                key={column.id}
                column={column}
                index={index}
                cardIds={cardOrder[column.id] ?? []}
                cardsById={cardsById}
                onRename={(name) =>
                  renameColumnMutation.mutate(
                    { organizationId, id: column.id, name },
                    {
                      onError: () => toast.add({ title: t`Couldn't rename column`, type: "error" }),
                    },
                  )
                }
                onDelete={() =>
                  deleteColumnMutation.mutate(
                    { organizationId, id: column.id },
                    {
                      onError: () => toast.add({ title: t`Couldn't delete column`, type: "error" }),
                    },
                  )
                }
                onAddCard={() => setDialogState({ mode: "create", columnId: column.id })}
                onCardClick={(card) => setDialogState({ mode: "edit", card })}
              />
            );
          })}

          <div className="w-72 shrink-0">
            {isAddingColumn ? (
              <Input
                autoFocus
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onBlur={submitNewColumn}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNewColumn();
                  if (e.key === "Escape") {
                    setIsAddingColumn(false);
                    setNewColumnName("");
                  }
                }}
                placeholder={t`Column name`}
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsAddingColumn(true)}
              >
                <Plus />
                {t`Add column`}
              </Button>
            )}
          </div>
        </div>
      </DragDropProvider>

      <OutreachCardDialog
        organizationId={organizationId}
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
      />
    </div>
  );
}
