import { useEffect, useRef, useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { tinykeys } from "tinykeys";
import { useMoveFilesMutation, useMoveFoldersMutation } from "@/services/resources/drive";
import type { DriveLocation } from "@echo/modules/drive/domain";
import { toast } from "@/components/ui/toast";
import { locationKey } from "@/lib/drive-location";
import {
  parseSelectionKey,
  readDragData,
  selectionKey,
  type DragEndEventPayload,
  type DragStartEventPayload,
  type DriveItemKind,
  type SelectionKey,
} from "./drive-item-utils";

export function useDriveSelection({
  organizationId,
  location,
  rows,
}: {
  organizationId: string;
  location: DriveLocation;
  rows: { kind: DriveItemKind; id: string }[];
}) {
  const { t } = useLingui();
  const [selectedKeys, setSelectedKeys] = useState<Set<SelectionKey>>(new Set());
  const selectionAnchorRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedKeys(new Set());
    selectionAnchorRef.current = null;
  }, [locationKey(location)]);

  useEffect(() => {
    return tinykeys(window, {
      Escape: () => {
        setSelectedKeys(new Set());
        selectionAnchorRef.current = null;
      },
    });
  }, []);

  const moveFoldersMutation = useMoveFoldersMutation();
  const moveFilesMutation = useMoveFilesMutation();

  const toggleSelection = (kind: DriveItemKind, id: string, options: { shiftKey?: boolean }) => {
    const key = selectionKey(kind, id);
    const index = rows.findIndex((row) => row.kind === kind && row.id === id);

    setSelectedKeys((prev) => {
      if (options.shiftKey && selectionAnchorRef.current !== null) {
        const start = Math.min(selectionAnchorRef.current, index);
        const end = Math.max(selectionAnchorRef.current, index);
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          next.add(selectionKey(rows[i].kind, rows[i].id));
        }
        return next;
      }
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

    if (!options.shiftKey) selectionAnchorRef.current = index;
  };

  const replaceSelection = (kind: DriveItemKind, id: string) => {
    selectionAnchorRef.current = rows.findIndex((row) => row.kind === kind && row.id === id);
    setSelectedKeys(new Set([selectionKey(kind, id)]));
  };

  const clearSelection = () => {
    setSelectedKeys(new Set());
    selectionAnchorRef.current = null;
  };

  const handleDragStart = (event: DragStartEventPayload) => {
    const source = readDragData(event.operation.source?.data);
    if (!source) return;
    if (!selectedKeys.has(selectionKey(source.kind, source.id))) {
      replaceSelection(source.kind, source.id);
    }
  };

  const handleDragEnd = (event: DragEndEventPayload) => {
    const source = readDragData(event.operation.source?.data);
    const target = readDragData(event.operation.target?.data);
    if (!source || !target || target.kind !== "folder") return;
    if (location.kind !== "root" && location.kind !== "folder") return;

    const sourceKey = selectionKey(source.kind, source.id);
    const movingKeys = selectedKeys.has(sourceKey) ? Array.from(selectedKeys) : [sourceKey];
    const movingItems = movingKeys
      .map((key) => ({ ...parseSelectionKey(key), key }))
      .filter((item) => !(item.kind === "folder" && item.id === target.id));

    if (movingItems.length === 0) return;

    const idsOf = (kind: DriveItemKind) =>
      movingItems.filter((item) => item.kind === kind).map((item) => item.id);
    const fileIds = idsOf("file");
    const folderIds = idsOf("folder");

    Promise.all([
      fileIds.length > 0 &&
        moveFilesMutation.mutateAsync({
          ids: fileIds,
          organizationId,
          from: location,
          folderId: target.id,
        }),
      folderIds.length > 0 &&
        moveFoldersMutation.mutateAsync({
          ids: folderIds,
          organizationId,
          parentFolderId: target.id,
        }),
    ]).then(
      () => {
        setSelectedKeys((prev) => {
          const next = new Set(prev);
          movingItems.forEach((item) => next.delete(item.key));
          return next;
        });
        if (movingItems.length > 1) {
          toast.add({ title: t`${movingItems.length} items moved`, type: "success" });
        }
      },
      (error: unknown) => {
        toast.add({
          title: t`Couldn't move items`,
          description: error instanceof Error ? error.message : undefined,
          type: "error",
        });
      },
    );
  };

  return {
    selectedKeys,
    setSelectedKeys,
    toggleSelection,
    replaceSelection,
    clearSelection,
    handleDragStart,
    handleDragEnd,
  };
}
