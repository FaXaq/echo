import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { getSongSearchQueryOptions } from "@/services/resources/song";
import { EntityPickerCombobox } from "./entity-picker-combobox";

export type SongOption = { id: string; title: string; artist: string | null };

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

function songLabel(song: SongOption) {
  return song.artist ? `${song.title} — ${song.artist}` : song.title;
}

export function SongPickerCombobox({
  organizationId,
  selectedSongs,
  onAdd,
  onRemove,
}: {
  organizationId: string;
  selectedSongs: SongOption[];
  onAdd: (songId: string) => void;
  onRemove: (songId: string) => void;
}) {
  const { t } = useLingui();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  const isSearchReady = debouncedQuery.length >= MIN_QUERY_LENGTH;
  const { data: results } = useQuery({
    ...getSongSearchQueryOptions({ organizationId, query: debouncedQuery }),
    enabled: isSearchReady,
  });

  const selectedIds = new Set(selectedSongs.map((song) => song.id));
  const options = isSearchReady ? (results ?? []).filter((song) => !selectedIds.has(song.id)) : [];

  return (
    <EntityPickerCombobox
      selected={selectedSongs}
      options={options}
      getId={(song) => song.id}
      getLabel={songLabel}
      onQueryChange={setQuery}
      onAdd={(song) => onAdd(song.id)}
      onRemove={(song) => onRemove(song.id)}
      placeholder={t`Search songs to add…`}
      emptyLabel={t`No matching songs`}
      promptLabel={t`Type to search songs`}
      isSearchReady={isSearchReady}
    />
  );
}
