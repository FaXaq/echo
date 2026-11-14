import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

  const request = async (fileId: string) => {
    try {
      setPending({ fileId, outcome: await describe(fileId) });
    } catch {
      toast.add({ title: t`Couldn't check where this file is`, type: "error" });
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

  return {
    describe,
    remove,
    request,
    dialogProps: {
      outcome: pending?.outcome ?? null,
      placeName,
      onOpenChange: (open: boolean) => !open && setPending(null),
      onConfirm: confirm,
    },
  };
}
