import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { plural } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import type { Place, PlaceLabel } from "@echo/modules/drive/domain";
import { toast } from "@/components/ui/toast";
import { locationKey } from "@/lib/drive-location";
import {
  fileOccurrencesQueryOptions,
  useRemoveOccurrenceMutation,
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
  const mutation = useRemoveOccurrenceMutation();
  const pathLabel = useOccurrencePathLabel();
  const [pending, setPending] = useState<{
    fileId: string;
    outcome: RemoveOccurrenceOutcome;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [bulk, setBulk] = useState<({ files: RemovableFile[] } & RemoveManyCounts) | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const describe = async (fileId: string): Promise<RemoveOccurrenceOutcome> => {
    const occurrences = await queryClient.fetchQuery({
      ...fileOccurrencesQueryOptions({ fileId, organizationId }),
      staleTime: 0,
    });
    const remaining = occurrences.filter(
      (entry) => locationKey(entry.place) !== locationKey(place),
    );
    return { isLast: remaining.length === 0, remaining };
  };

  const remove = (fileId: string) => mutation.mutateAsync({ fileId, place, organizationId });

  const checkFailed = () =>
    toast.add({ title: t`Couldn't check where this file is`, type: "error" });

  const request = async (fileId: string) => {
    try {
      setPending({ fileId, outcome: await describe(fileId) });
      setOpen(true);
    } catch {
      checkFailed();
    }
  };

  const confirm = async () => {
    if (!pending) return;
    const stillIn = pending.outcome.remaining.map(pathLabel).join(", ");
    try {
      const { deleted } = await remove(pending.fileId);
      toast.add({
        title: deleted ? t`File deleted` : t`Removed from ${placeName} — still in ${stillIn}`,
        type: "success",
      });
    } catch {
      toast.add({ title: t`Couldn't delete file`, type: "error" });
    }
  };

  const requestMany = async (files: RemovableFile[]) => {
    try {
      const outcomes = await Promise.all(files.map((file) => describe(file.id)));
      const deletedCount = outcomes.filter((outcome) => outcome.isLast).length;
      setBulk({ files, deletedCount, removedCount: files.length - deletedCount });
      setBulkOpen(true);
    } catch {
      checkFailed();
    }
  };

  const confirmMany = async () => {
    if (!bulk) return;
    const results = await Promise.allSettled(bulk.files.map((file) => remove(file.id)));
    const failedNames = results.flatMap((result, index) =>
      result.status === "rejected" ? [bulk.files[index].filename] : [],
    );
    const deletedCount = results.filter(
      (result) => result.status === "fulfilled" && result.value.deleted,
    ).length;
    const removedCount = results.length - failedNames.length - deletedCount;

    if (failedNames.length === 0) {
      toast.add({ title: describeManyOutcome({ removedCount, deletedCount }), type: "success" });
    } else {
      toast.add({
        title: t`${results.length - failedNames.length} of ${results.length} removed — failed: ${failedNames.join(", ")}`,
        type: "error",
      });
    }
  };

  return {
    describe,
    remove,
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
