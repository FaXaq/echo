import type { Meta, StoryObj } from "@storybook/react";
import { ResetPasswordForm } from "@/components/reset-password-form";

const meta = {
  title: "Components/ResetPasswordForm",
  component: ResetPasswordForm,
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
} satisfies Meta<typeof ResetPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { isLoading: true },
};

export const ServerError: Story = {
  args: { serverError: "This reset link has expired" },
};
