import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { Folder as FolderIcon, FileText, Image as ImageIcon, Music, Video } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { formatDriveSearchLocation } from "@/lib/drive-search";
import { getDriveSearchQueryOptions } from "@/services/resources/drive";

const KIND_ICON = {
  audio: Music,
  video: Video,
  image: ImageIcon,
  document: FileText,
} as const;

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

// Deliberate exception to the Suspended<Name> convention: a live-search-as-you-type
// box has no meaningful Suspense state for an empty/short query, so this uses a plain
// (non-suspense) useQuery gated by `enabled`, same as any typeahead.
export function DriveSearchCombobox({
  organizationId,
  onSelectFolder,
  onSelectFile,
}: {
  organizationId: string;
  onSelectFolder: (folderId: string) => void;
  onSelectFile: (file: { id: string; folderId: string | null }) => void;
}) {
  const { t } = useLingui();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const trimmedQuery = query.trim();
  const isSearchable = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const [debouncedQuery, setDebouncedQuery] = useState(trimmedQuery);
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(trimmedQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [trimmedQuery]);

  const isDebouncePending = isSearchable && debouncedQuery !== trimmedQuery;
  const isSearchReady = isSearchable && !isDebouncePending;

  const { data, isFetching } = useQuery({
    ...getDriveSearchQueryOptions({ organizationId, query: debouncedQuery }),
    enabled: isSearchReady,
  });

  const folders = isSearchReady ? (data?.folders ?? []) : [];
  const files = isSearchReady ? (data?.files ?? []) : [];
  const isSearching = isDebouncePending || (isSearchReady && isFetching);
  const hasNoResults = isSearchReady && !isFetching && folders.length === 0 && files.length === 0;

  const closeAndReset = () => {
    setOpen(false);
    setQuery("");
    anchorRef.current?.querySelector<HTMLInputElement>("input")?.blur();
  };

  return (
    <Popover open={open && isSearchable} onOpenChange={setOpen}>
      <Command shouldFilter={false} className="w-64 overflow-visible bg-transparent p-0">
        <div ref={anchorRef}>
          <CommandInput
            value={query}
            onValueChange={(value) => {
              setQuery(value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") closeAndReset();
            }}
            placeholder={t`Search Drive`}
          />
        </div>
        <PopoverContent
          anchor={anchorRef}
          align="start"
          className="w-80 p-0"
          initialFocus={false}
          finalFocus={false}
        >
          <CommandList>
            {isSearching && <CommandEmpty>{t`Searching…`}</CommandEmpty>}
            {hasNoResults && <CommandEmpty>{t`No matches`}</CommandEmpty>}
            {folders.length > 0 && (
              <CommandGroup heading={t`Folders`}>
                {folders.map((folder) => (
                  <CommandItem
                    key={folder.id}
                    value={`folder:${folder.id}`}
                    onSelect={() => {
                      closeAndReset();
                      onSelectFolder(folder.id);
                    }}
                  >
                    <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{folder.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {formatDriveSearchLocation(folder.path)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {files.length > 0 && (
              <CommandGroup heading={t`Files`}>
                {files.map((file) => {
                  const Icon = KIND_ICON[file.kind];
                  return (
                    <CommandItem
                      key={file.id}
                      value={`file:${file.id}`}
                      onSelect={() => {
                        closeAndReset();
                        onSelectFile({ id: file.id, folderId: file.folderId });
                      }}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{file.filename}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {formatDriveSearchLocation(file.path)}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </PopoverContent>
      </Command>
    </Popover>
  );
}
