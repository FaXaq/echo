import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { plural } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import type { Place, PlaceLabel } from "@echo/modules/drive/domain";
import { toast } from "@/components/ui/toast";
import { locationKey } from "@/lib/drive-location";
import {
  fileOccurrencesQueryOptions,
  useRemoveOccurrencesMutation,
} from "@/services/resources/drive";

export interface RemoveOccurrenceOutcome {
  isLast: boolean;
  remaining: PlaceLabel[];
}

export interface RemoveManyCounts {
  removedCount: number;
  deletedCount: number;
}

interface RemovableFile {
  id: string;
  filename: string;
}

export function useOccurrencePathLabel() {
  const { t } = useLingui();
  return ({ place, path }: PlaceLabel) => {
    if (path.length === 0) return t`Drive`;
    const [first, ...rest] = path;
    const head = place.kind === "event" ? t`Events` : place.kind === "song" ? t`Songs` : first;
    return [head, ...rest].join(" › ");
  };
}

export function useRemoveOccurrence(place: Place, organizationId: string, placeName: string) {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const mutation = useRemoveOccurrencesMutation();
  const pathLabel = useOccurrencePathLabel();
  const [pending, setPending] = useState<{
    fileId: string;
    outcome: RemoveOccurrenceOutcome;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [bulk, setBulk] = useState<({ files: RemovableFile[] } & RemoveManyCounts) | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const describe = async (fileIds: string[]) => {
    const occurrences = await queryClient.fetchQuery({
      ...fileOccurrencesQueryOptions({ fileIds, organizationId }),
      staleTime: 0,
    });
    return fileIds.map((fileId): RemoveOccurrenceOutcome => {
      const remaining = (occurrences[fileId] ?? []).filter(
        (entry) => locationKey(entry.place) !== locationKey(place),
      );
      return { isLast: remaining.length === 0, remaining };
    });
  };

  const remove = (fileIds: string[]) => mutation.mutateAsync({ fileIds, place, organizationId });

  const checkFailed = () =>
    toast.add({ title: t`Couldn't check where this file is`, type: "error" });

  const request = async (fileId: string) => {
    try {
      const [outcome] = await describe([fileId]);
      setPending({ fileId, outcome });
      setOpen(true);
    } catch {
      checkFailed();
    }
  };

  const confirm = async () => {
    if (!pending) return;
    const stillIn = pending.outcome.remaining.map(pathLabel).join(", ");
    try {
      const { deletedFileIds } = await remove([pending.fileId]);
      toast.add({
        title:
          deletedFileIds.length > 0
            ? t`File deleted`
            : t`Removed from ${placeName} — still in ${stillIn}`,
        type: "success",
      });
    } catch {
      toast.add({ title: t`Couldn't remove file`, type: "error" });
    }
  };

  const requestMany = async (files: RemovableFile[]) => {
    try {
      const outcomes = await describe(files.map((file) => file.id));
      const deletedCount = outcomes.filter((outcome) => outcome.isLast).length;
      setBulk({ files, deletedCount, removedCount: files.length - deletedCount });
      setBulkOpen(true);
    } catch {
      checkFailed();
    }
  };

  const confirmMany = async () => {
    if (!bulk) return;
    const result = await remove(bulk.files.map((file) => file.id)).catch(() => null);
    const removedFileIds = result?.removedFileIds ?? [];
    const failedNames = bulk.files
      .filter((file) => !removedFileIds.includes(file.id))
      .map((file) => file.filename);
    const deletedCount = result?.deletedFileIds.length ?? 0;
    const removedCount = removedFileIds.length - deletedCount;

    if (failedNames.length === 0) {
      toast.add({ title: describeManyOutcome({ removedCount, deletedCount }), type: "success" });
    } else {
      toast.add({
        title: t`${removedFileIds.length} of ${bulk.files.length} removed — failed: ${failedNames.join(", ")}`,
        type: "error",
      });
    }
  };

  return {
    request,
    requestMany,
    dialogProps: {
      open,
      outcome: pending?.outcome ?? null,
      placeName,
      onOpenChange: setOpen,
      onConfirm: confirm,
    },
    bulkDialogProps: {
      open: bulkOpen,
      counts: bulk,
      onOpenChange: setBulkOpen,
      onConfirm: confirmMany,
    },
  };
}

function describeManyOutcome({ removedCount, deletedCount }: RemoveManyCounts) {
  const parts = [];
  if (removedCount > 0) {
    parts.push(
      plural(removedCount, { one: "# file removed from here", other: "# files removed from here" }),
    );
  }
  if (deletedCount > 0) {
    parts.push(
      plural(deletedCount, {
        one: "# file permanently deleted",
        other: "# files permanently deleted",
      }),
    );
  }
  return parts.join(", ");
}
