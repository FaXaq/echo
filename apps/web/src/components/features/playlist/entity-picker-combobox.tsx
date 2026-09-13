import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export function EntityPickerCombobox<T>({
  selected,
  options,
  getId,
  getLabel,
  onQueryChange,
  onAdd,
  onRemove,
  placeholder,
  emptyLabel,
  promptLabel,
  isSearchReady,
}: {
  selected: T[];
  options: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  onQueryChange: (query: string) => void;
  onAdd: (item: T) => void;
  onRemove: (item: T) => void;
  placeholder: string;
  emptyLabel: string;
  promptLabel: string;
  isSearchReady: boolean;
}) {
  return (
    <Combobox
      multiple
      items={options}
      filter={null}
      value={selected}
      isItemEqualToValue={(a: T, b: T) => getId(a) === getId(b)}
      itemToStringLabel={getLabel}
      onInputValueChange={onQueryChange}
      onValueChange={(next: T[], details) => {
        if (details.reason === "chip-remove-press") {
          const nextIds = new Set(next.map(getId));
          const removed = selected.find((item) => !nextIds.has(getId(item)));
          if (removed) onRemove(removed);
          return;
        }
        const selectedIds = new Set(selected.map(getId));
        const added = next.find((item) => !selectedIds.has(getId(item)));
        if (added) onAdd(added);
      }}
    >
      <ComboboxChips>
        {selected.map((item) => (
          <ComboboxChip key={getId(item)}>{getLabel(item)}</ComboboxChip>
        ))}
        <ComboboxChipsInput placeholder={placeholder} />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxList>
          <ComboboxEmpty>{isSearchReady ? emptyLabel : promptLabel}</ComboboxEmpty>
          {options.map((item) => (
            <ComboboxItem key={getId(item)} value={item}>
              {getLabel(item)}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
