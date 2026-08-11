import type { Meta, StoryObj } from "@storybook/react";
import { CalendarIcon, FolderIcon, MusicIcon, UsersIcon } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

const meta = {
  title: "UI/Command",
  component: Command,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="h-80 w-80 border shadow-md">
      <CommandInput placeholder="Search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem>
            <CalendarIcon />
            Calendar
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <FolderIcon />
            Drive
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Bands">
          <CommandItem>
            <UsersIcon />
            Members
          </CommandItem>
          <CommandItem>
            <MusicIcon />
            Tracks
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Dialog: Story = {
  render: () => (
    <CommandDialog open>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem>
            <CalendarIcon />
            Calendar
          </CommandItem>
          <CommandItem>
            <FolderIcon />
            Drive
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  ),
};
