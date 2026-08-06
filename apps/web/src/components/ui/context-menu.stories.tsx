import type { Meta, StoryObj } from "@storybook/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  ContextMenuCheckboxItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";

const meta = {
  title: "UI/ContextMenu",
  component: ContextMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-24 w-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Right-click here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Actions</ContextMenuLabel>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem>
          Open
          <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Copy link</ContextMenuItem>
            <ContextMenuItem>Email</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithCheckboxes: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-24 w-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Right-click for view options
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>View</ContextMenuLabel>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>Show grid</ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>Show rulers</ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked>Snap to grid</ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
