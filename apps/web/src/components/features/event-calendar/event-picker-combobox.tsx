import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import dayjs from "dayjs";
import { EntityPickerCombobox } from "@/components/features/playlist/entity-picker-combobox";
import { type CalendarEvent, getEventSearchQueryOptions } from "@/services/resources/calendar";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

function eventLabel(event: CalendarEvent) {
  return `${event.title} — ${dayjs(event.startDate).format("MMM D, YYYY")}`;
}

export function EventPickerCombobox({
  organizationId,
  onSelect,
}: {
  organizationId: string;
  onSelect: (eventId: string) => void;
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
    ...getEventSearchQueryOptions({ organizationId, query: debouncedQuery }),
    enabled: isSearchReady,
  });

  return (
    <EntityPickerCombobox
      options={isSearchReady ? (results ?? []) : []}
      getId={(event) => event.id}
      getLabel={eventLabel}
      onQueryChange={setQuery}
      onSelect={(event) => onSelect(event.id)}
      placeholder={t`Search events…`}
      emptyLabel={t`No matching events`}
      promptLabel={t`Type to search events`}
      isSearchReady={isSearchReady}
    />
  );
}
