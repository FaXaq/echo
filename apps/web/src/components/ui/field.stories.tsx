import type { Meta, StoryObj } from "@storybook/react";
import { Field, FieldLabel, FieldDescription, FieldError, FieldSet, FieldLegend, FieldContent } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Field",
  component: Field,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <FieldContent>
        <Input type="email" placeholder="your@email.com" />
      </FieldContent>
    </Field>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Field>
      <FieldLabel>Username</FieldLabel>
      <FieldContent>
        <Input placeholder="Enter your username" />
        <FieldDescription>Choose a unique username for your account.</FieldDescription>
      </FieldContent>
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field>
      <FieldLabel>Password</FieldLabel>
      <FieldContent>
        <Input type="password" placeholder="Enter password" aria-invalid="true" />
        <FieldError>Password must be at least 8 characters</FieldError>
      </FieldContent>
    </Field>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal">
      <FieldLabel>Subscribe</FieldLabel>
      <FieldContent>
        <Input type="checkbox" />
      </FieldContent>
    </Field>
  ),
};

export const FieldSetExample: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Personal Information</FieldLegend>
      <Field>
        <FieldLabel>First Name</FieldLabel>
        <FieldContent>
          <Input placeholder="John" />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Last Name</FieldLabel>
        <FieldContent>
          <Input placeholder="Doe" />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Email</FieldLabel>
        <FieldContent>
          <Input type="email" placeholder="john@example.com" />
        </FieldContent>
      </Field>
    </FieldSet>
  ),
};

export const Form: Story = {
  render: () => (
    <FieldSet className="gap-4">
      <FieldLegend variant="label">Sign In</FieldLegend>
      <Field>
        <FieldLabel>Email</FieldLabel>
        <FieldContent>
          <Input type="email" placeholder="your@email.com" />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Password</FieldLabel>
        <FieldContent>
          <Input type="password" placeholder="Enter password" />
        </FieldContent>
      </Field>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button className="flex-1">Sign In</Button>
      </div>
    </FieldSet>
  ),
};
