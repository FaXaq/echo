import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { getPlaylistSearchQueryOptions } from "@/services/resources/playlist";
import { EntityPickerCombobox } from "./entity-picker-combobox";

export type PlaylistOption = { id: string; title: string };

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

export function PlaylistPickerCombobox({
  organizationId,
  selectedPlaylists,
  onAdd,
  onRemove,
}: {
  organizationId: string;
  selectedPlaylists: PlaylistOption[];
  onAdd: (playlistId: string) => void;
  onRemove: (playlistId: string) => void;
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
    ...getPlaylistSearchQueryOptions({ organizationId, query: debouncedQuery }),
    enabled: isSearchReady,
  });

  const selectedIds = new Set(selectedPlaylists.map((playlist) => playlist.id));
  const options = isSearchReady
    ? (results ?? []).filter((playlist) => !selectedIds.has(playlist.id))
    : [];

  return (
    <EntityPickerCombobox
      selected={selectedPlaylists}
      options={options}
      getId={(playlist) => playlist.id}
      getLabel={(playlist) => playlist.title}
      onQueryChange={setQuery}
      onAdd={(playlist) => onAdd(playlist.id)}
      onRemove={(playlist) => onRemove(playlist.id)}
      placeholder={t`Search playlists to attach…`}
      emptyLabel={t`No matching playlists`}
      promptLabel={t`Type to search playlists`}
      isSearchReady={isSearchReady}
    />
  );
}
