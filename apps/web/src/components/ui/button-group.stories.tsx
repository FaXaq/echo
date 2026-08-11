import type { Meta, StoryObj } from "@storybook/react";
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/components/ui/button-group";

const meta = {
  title: "UI/ButtonGroup",
  component: ButtonGroup,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline" size="icon">
        <BoldIcon />
      </Button>
      <Button variant="outline" size="icon">
        <ItalicIcon />
      </Button>
      <Button variant="outline" size="icon">
        <UnderlineIcon />
      </Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline" size="icon">
        <BoldIcon />
      </Button>
      <Button variant="outline" size="icon">
        <ItalicIcon />
      </Button>
      <Button variant="outline" size="icon">
        <UnderlineIcon />
      </Button>
    </ButtonGroup>
  ),
};

export const WithText: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroupText>Format</ButtonGroupText>
      <ButtonGroupSeparator />
      <Button variant="outline" size="icon">
        <BoldIcon />
      </Button>
      <Button variant="outline" size="icon">
        <ItalicIcon />
      </Button>
    </ButtonGroup>
  ),
};
