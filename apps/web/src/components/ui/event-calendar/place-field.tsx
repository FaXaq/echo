import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { searchPlaces } from "@/services/resources/place";

import type { EventPlace } from "./types";

const SEARCH_DEBOUNCE_MS = 300;

export interface PlaceFieldProps {
  id?: string;
  value: EventPlace | null;
  onChange: (value: EventPlace | null) => void;
}

export function PlaceField({ id, value, onChange }: PlaceFieldProps) {
  const { t } = useTranslation("calendar");
  const [inputValue, setInputValue] = useState(value?.name ?? "");
  const [results, setResults] = useState<EventPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  const NAVIGATION_KEYS = ["ArrowDown", "ArrowUp", "Home", "End", "Enter"];

  function forwardKeyToCommand(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!NAVIGATION_KEYS.includes(e.key)) return;
    e.preventDefault();
    commandRef.current?.dispatchEvent(
      new KeyboardEvent("keydown", { key: e.key, bubbles: true, cancelable: true }),
    );
  }

  useEffect(() => {
    setInputValue(value?.name ?? "");
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  function handleInputValueChange(nextInputValue: string) {
    setInputValue(nextInputValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const query = nextInputValue.trim();
    if (!query) {
      setResults([]);
      setIsSearching(false);
      setOpen(false);
      return;
    }

    setOpen(true);
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      searchPlaces(query, { signal: controller.signal })
        .then((places) => {
          if (controller.signal.aborted) return;
          setResults(places);
          setIsSearching(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setResults([]);
          setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSelect(place: EventPlace) {
    onChange(place);
    setResults([]);
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setInputValue("");
    setResults([]);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            autoComplete="off"
            value={inputValue}
            placeholder={t("Search for a place")}
            onChange={(e) => handleInputValueChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0 || isSearching) setOpen(true);
            }}
            onKeyDown={forwardKeyToCommand}
            className={value ? "pr-6" : undefined}
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t("Clear place")}
              className="absolute right-0.5 top-1/2 -translate-y-1/2"
              onClick={handleClear}
            >
              <X />
            </Button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command ref={commandRef} shouldFilter={false}>
          <CommandList>
            {results.length === 0 && (
              <CommandEmpty>
                {isSearching ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" />
                    {t("Searching…")}
                  </span>
                ) : (
                  t("No places found")
                )}
              </CommandEmpty>
            )}
            <CommandGroup>
              {results.map((place) => (
                <CommandItem
                  key={`${place.lat},${place.lng}`}
                  value={`${place.lat},${place.lng}`}
                  onSelect={() => handleSelect(place)}
                >
                  <div className="flex flex-col">
                    <span>{place.name}</span>
                    <span className="text-xs text-muted-foreground">{place.address}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
