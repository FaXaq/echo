import { useQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { type CalendarEvent, getEventQueryOptions } from "@/services/resources/calendar";
import { useEventLabel, useEventSearch } from "./event-picker-combobox";

export function EventSelectCombobox({
  id,
  organizationId,
  value,
  onChange,
}: {
  id?: string;
  organizationId: string;
  value: string;
  onChange: (eventId: string) => void;
}) {
  const { t } = useLingui();
  const search = useEventSearch(organizationId);
  const eventLabel = useEventLabel();
  const { data: selected } = useQuery({
    ...getEventQueryOptions({ eventId: value, organizationId }),
    enabled: value !== "",
  });

  return (
    <Combobox<CalendarEvent>
      items={search.results}
      filter={null}
      value={value === "" ? null : (selected ?? null)}
      isItemEqualToValue={(item, current) => item.id === current.id}
      itemToStringLabel={eventLabel}
      onInputValueChange={(input, details) => {
        if (details.reason === "item-press") return;
        search.setQuery(input);
      }}
      onValueChange={(event) => {
        onChange(event?.id ?? "");
        search.setQuery("");
      }}
    >
      <ComboboxInput
        id={id}
        className="w-full"
        placeholder={t`No event`}
        showClear={value !== ""}
      />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxEmpty>
            {search.isSearchReady ? t`No matching events` : t`Type to search events`}
          </ComboboxEmpty>
          {search.results.map((event) => (
            <ComboboxItem key={event.id} value={event}>
              {eventLabel(event)}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
