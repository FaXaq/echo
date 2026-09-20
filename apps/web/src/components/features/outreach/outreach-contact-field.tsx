import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { listContactsQueryOptions, useCreateContactMutation } from "@/services/resources/contact";

export interface OutreachContactValue {
  id: string;
  name: string;
}

export interface OutreachContactFieldProps {
  id?: string;
  organizationId: string;
  value: OutreachContactValue[];
  onChange: (next: OutreachContactValue[]) => void;
}

export function OutreachContactField({
  id,
  organizationId,
  value,
  onChange,
}: OutreachContactFieldProps) {
  const { t } = useLingui();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { data: contacts } = useQuery(listContactsQueryOptions({ organizationId }));
  const createContactMutation = useCreateContactMutation();

  const selectedIds = new Set(value.map((contact) => contact.id));
  const trimmedQuery = query.trim();
  const results = (contacts ?? []).filter(
    (contact) =>
      !selectedIds.has(contact.id) &&
      contact.name.toLowerCase().includes(trimmedQuery.toLowerCase()),
  );
  const hasExactMatch = (contacts ?? []).some(
    (contact) => contact.name.toLowerCase() === trimmedQuery.toLowerCase(),
  );

  const addContact = (contact: OutreachContactValue) => {
    onChange([...value, contact]);
    setQuery("");
  };

  const removeContact = (contactId: string) => {
    onChange(value.filter((contact) => contact.id !== contactId));
  };

  const createAndAddContact = () => {
    if (!trimmedQuery) return;
    createContactMutation.mutate(
      { organizationId, name: trimmedQuery },
      { onSuccess: (contact) => addContact({ id: contact.id, name: contact.name }) },
    );
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((contact) => (
            <Badge key={contact.id} variant="secondary">
              {contact.name}
              <button
                type="button"
                onClick={() => removeContact(contact.id)}
                aria-label={t`Remove ${contact.name}`}
                className="cursor-pointer"
              >
                <XIcon />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false} className="overflow-visible bg-transparent p-0">
          <div ref={anchorRef}>
            <CommandInput
              id={id}
              value={query}
              onValueChange={(next) => {
                setQuery(next);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={t`Add a contact`}
            />
          </div>
          <PopoverContent
            anchor={anchorRef}
            align="start"
            className="w-(--anchor-width) p-0"
            initialFocus={false}
          >
            <CommandList>
              {results.length === 0 && !trimmedQuery && (
                <CommandEmpty>{t`No contacts`}</CommandEmpty>
              )}
              <CommandGroup>
                {results.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={contact.id}
                    onSelect={() => addContact({ id: contact.id, name: contact.name })}
                  >
                    {contact.name}
                  </CommandItem>
                ))}
                {trimmedQuery && !hasExactMatch && (
                  <CommandItem value={`create:${trimmedQuery}`} onSelect={createAndAddContact}>
                    {t`Create "${trimmedQuery}"`}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
    </div>
  );
}
