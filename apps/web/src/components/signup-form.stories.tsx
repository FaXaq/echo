import type { Meta, StoryObj } from "@storybook/react";
import { SignupForm } from "@/components/signup-form";

const meta = {
  title: "Components/SignupForm",
  component: SignupForm,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onSubmit: () => {} },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNavigation: Story = {
  args: { onLoginClick: () => {} },
};

export const Loading: Story = {
  args: { isLoading: true },
};

export const ServerError: Story = {
  args: { serverError: "Username already taken" },
};
