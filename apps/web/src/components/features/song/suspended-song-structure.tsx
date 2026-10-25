import { Suspense, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import type { SongStructure, TimeSignature } from "@echo/modules/song/domain";

import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { SongStructureEditor } from "@/components/ui/song/structure/song-structure-editor";
import {
  getSongStructureQueryOptions,
  useUpdateSongStructureMutation,
} from "@/services/resources/song";

const STRUCTURE_AUTOSAVE_DEBOUNCE_MS = 600;

interface SuspendedSongStructureProps {
  songId: string;
  organizationId: string;
  defaultTime: TimeSignature;
}

function SongStructureContent({
  songId,
  organizationId,
  defaultTime,
}: SuspendedSongStructureProps) {
  const { t } = useLingui();
  const { data } = useSuspenseQuery(getSongStructureQueryOptions({ songId, organizationId }));
  const [structure, setStructure] = useState<SongStructure>(data);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const structureRef = useRef(structure);
  structureRef.current = structure;

  const { mutate } = useUpdateSongStructureMutation({
    organizationId,
    onError: () => toast.add({ type: "error", title: t`Failed to save structure` }),
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        mutate({ id: songId, structure: structureRef.current });
      }
    };
  }, [songId, mutate]);

  const handleChange = (next: SongStructure) => {
    setStructure(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      mutate({ id: songId, structure: next });
    }, STRUCTURE_AUTOSAVE_DEBOUNCE_MS);
  };

  return (
    <SongStructureEditor structure={structure} defaultTime={defaultTime} onChange={handleChange} />
  );
}

function SongStructureError() {
  const { t } = useLingui();
  return <p className="text-sm text-muted-foreground">{t`Failed to load structure`}</p>;
}

export function SuspendedSongStructure(props: SuspendedSongStructureProps) {
  return (
    <ErrorBoundary fallback={<SongStructureError />}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <SongStructureContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
