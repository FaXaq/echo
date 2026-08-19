import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { toast } from "@/components/ui/toast";

export function useDrivePendingDeletes() {
  const { t } = useLingui();
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

  const clearPendingDelete = (id: string) => {
    setPendingDeleteIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const scheduleDelete = (id: string, title: string, commit: () => void) => {
    setPendingDeleteIds((prev) => new Set(prev).add(id));
    let undone = false;
    const toastId = toast.add({
      title,
      type: "success",
      actionProps: {
        children: t`Undo`,
        onClick: () => {
          undone = true;
          clearPendingDelete(id);
          toast.close(toastId);
        },
      },
      onRemove: () => {
        if (!undone) commit();
      },
    });
  };

  return { pendingDeleteIds, scheduleDelete, clearPendingDelete };
}
