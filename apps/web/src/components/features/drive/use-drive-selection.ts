import { useEffect, useRef, useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { tinykeys } from "tinykeys";
import {
  useMoveFileMutation,
  useMoveFolderMutation,
  type Folder,
  type OrganizationFile,
} from "@/services/resources/drive";
import { toast } from "@/components/ui/toast";
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
  folderId,
  rows,
  visibleFolders,
  visibleFiles,
}: {
  organizationId: string;
  folderId: string | null;
  rows: { kind: DriveItemKind; id: string }[];
  visibleFolders: Folder[];
  visibleFiles: OrganizationFile[];
}) {
  const { t } = useLingui();
  const [selectedKeys, setSelectedKeys] = useState<Set<SelectionKey>>(new Set());
  const selectionAnchorRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedKeys(new Set());
    selectionAnchorRef.current = null;
  }, [folderId]);

  useEffect(() => {
    return tinykeys(window, {
      Escape: () => {
        setSelectedKeys(new Set());
        selectionAnchorRef.current = null;
      },
    });
  }, []);

  const moveFolderMutation = useMoveFolderMutation();
  const moveFileMutation = useMoveFileMutation();

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

  const toggleSelectAll = () => {
    if (selectedKeys.size === rows.length && rows.length > 0) {
      clearSelection();
    } else {
      setSelectedKeys(new Set(rows.map((row) => selectionKey(row.kind, row.id))));
    }
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

    const sourceKey = selectionKey(source.kind, source.id);
    const movingKeys = selectedKeys.has(sourceKey) ? Array.from(selectedKeys) : [sourceKey];
    const movingItems = movingKeys
      .map((key) => ({ ...parseSelectionKey(key), key }))
      .filter((item) => !(item.kind === "folder" && item.id === target.id));

    if (movingItems.length === 0) return;

    if (movingItems.length === 1) {
      const item = movingItems[0];
      if (item.kind === "file") {
        moveFileMutation.mutate({ id: item.id, organizationId, folderId: target.id });
      } else {
        moveFolderMutation.mutate({ id: item.id, organizationId, parentFolderId: target.id });
      }
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.delete(item.key);
        return next;
      });
      return;
    }

    Promise.allSettled(
      movingItems.map((item) =>
        item.kind === "file"
          ? moveFileMutation.mutateAsync({ id: item.id, organizationId, folderId: target.id })
          : moveFolderMutation.mutateAsync({
              id: item.id,
              organizationId,
              parentFolderId: target.id,
            }),
      ),
    ).then((results) => {
      const failedNames: string[] = [];
      const succeededKeys: SelectionKey[] = [];

      results.forEach((result, index) => {
        const item = movingItems[index];
        if (result.status === "fulfilled") {
          succeededKeys.push(item.key);
        } else {
          const name =
            item.kind === "file"
              ? visibleFiles.find((file) => file.id === item.id)?.filename
              : visibleFolders.find((folder) => folder.id === item.id)?.name;
          failedNames.push(name ?? item.id);
        }
      });

      setSelectedKeys((prev) => {
        const next = new Set(prev);
        succeededKeys.forEach((key) => next.delete(key));
        return next;
      });

      if (failedNames.length === 0) {
        toast.add({ title: t`${movingItems.length} items moved`, type: "success" });
      } else {
        toast.add({
          title: t`${succeededKeys.length} of ${movingItems.length} moved — failed: ${failedNames.join(", ")}`,
          type: "error",
        });
      }
    });
  };

  const allSelected = rows.length > 0 && selectedKeys.size === rows.length;
  const someSelected = selectedKeys.size > 0 && !allSelected;

  return {
    selectedKeys,
    setSelectedKeys,
    toggleSelection,
    replaceSelection,
    clearSelection,
    toggleSelectAll,
    handleDragStart,
    handleDragEnd,
    allSelected,
    someSelected,
  };
}
