import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string>("");

    return (
      <Select value={value} onValueChange={(next) => setValue(next ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option-1">Option 1</SelectItem>
          <SelectItem value="option-2">Option 2</SelectItem>
          <SelectItem value="option-3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
  },
};

export const WithGroups: Story = {
  render: () => {
    const [value, setValue] = useState<string>("");

    return (
      <Select value={value} onValueChange={(next) => setValue(next ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="broccoli">Broccoli</SelectItem>
            <SelectItem value="spinach">Spinach</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState<string>("");

    return (
      <Select value={value} onValueChange={(next) => setValue(next ?? "")} disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option-1">Option 1</SelectItem>
          <SelectItem value="option-2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
  },
};

export const DisabledItem: Story = {
  render: () => {
    const [value, setValue] = useState<string>("");

    return (
      <Select value={value} onValueChange={(next) => setValue(next ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option-1">Option 1</SelectItem>
          <SelectItem value="option-2" disabled>
            Option 2 (Disabled)
          </SelectItem>
          <SelectItem value="option-3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
  },
};

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState<string>("");

    return (
      <Select value={value} onValueChange={(next) => setValue(next ?? "")}>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Small select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option-1">Option 1</SelectItem>
          <SelectItem value="option-2">Option 2</SelectItem>
          <SelectItem value="option-3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
  },
};

export const WithDefault: Story = {
  render: () => {
    const [value, setValue] = useState<string>("option-2");

    return (
      <Select value={value} onValueChange={(next) => setValue(next ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option-1">Option 1</SelectItem>
          <SelectItem value="option-2">Option 2 (Selected)</SelectItem>
          <SelectItem value="option-3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
  },
};
