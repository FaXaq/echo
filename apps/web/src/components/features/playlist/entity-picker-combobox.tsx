import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export function EntityPickerCombobox<T>({
  options,
  getId,
  getLabel,
  onQueryChange,
  onSelect,
  placeholder,
  emptyLabel,
  promptLabel,
  isSearchReady,
}: {
  options: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  onQueryChange: (query: string) => void;
  onSelect: (item: T) => void;
  placeholder: string;
  emptyLabel: string;
  promptLabel: string;
  isSearchReady: boolean;
}) {
  const [inputValue, setInputValue] = useState("");

  return (
    <Combobox
      items={options}
      filter={null}
      value={null}
      inputValue={inputValue}
      itemToStringLabel={getLabel}
      onInputValueChange={(value, details) => {
        if (details.reason === "item-press") return;
        setInputValue(value);
        onQueryChange(value);
      }}
      onValueChange={(item: T | null) => {
        if (!item) return;
        onSelect(item);
        setInputValue("");
        onQueryChange("");
      }}
    >
      <ComboboxInput placeholder={placeholder} />
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
