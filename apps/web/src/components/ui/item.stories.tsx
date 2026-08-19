import type { Meta, StoryObj } from "@storybook/react";
import { Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";

const meta = {
  title: "UI/Item",
  component: Item,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Item variant="outline" className="w-96">
      <ItemMedia variant="icon">
        <Music2 />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Rehearsal</ItemTitle>
        <ItemDescription>Tuesday, 7:00 PM — Studio B</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const Group: Story = {
  render: () => (
    <ItemGroup className="w-96">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Music2 />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Rehearsal</ItemTitle>
          <ItemDescription>Tuesday, 7:00 PM — Studio B</ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Music2 />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Concert</ItemTitle>
          <ItemDescription>Friday, 9:00 PM — The Venue</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};
