import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { EntityPickerCombobox } from "@/components/features/playlist/entity-picker-combobox";
import { formatEventWhen } from "@/lib/event-format";
import { type CalendarEvent, getEventSearchQueryOptions } from "@/services/resources/calendar";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

export function useEventSearch(organizationId: string) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  const isSearchReady = debouncedQuery.length >= MIN_QUERY_LENGTH;
  const { data: results } = useQuery({
    ...getEventSearchQueryOptions({ organizationId, query: debouncedQuery }),
    enabled: isSearchReady,
  });

  return { setQuery, isSearchReady, results: isSearchReady ? (results ?? []) : [] };
}

export function useEventLabel() {
  const { i18n } = useLingui();
  return (event: CalendarEvent) => `${event.title} — ${formatEventWhen(event, i18n.locale)}`;
}

export function EventPickerCombobox({
  organizationId,
  onSelect,
}: {
  organizationId: string;
  onSelect: (eventId: string) => void;
}) {
  const { t } = useLingui();
  const search = useEventSearch(organizationId);
  const eventLabel = useEventLabel();

  return (
    <EntityPickerCombobox
      options={search.results}
      getId={(event) => event.id}
      getLabel={eventLabel}
      onQueryChange={search.setQuery}
      onSelect={(event) => onSelect(event.id)}
      placeholder={t`Search events…`}
      emptyLabel={t`No matching events`}
      promptLabel={t`Type to search events`}
      isSearchReady={search.isSearchReady}
    />
  );
}
