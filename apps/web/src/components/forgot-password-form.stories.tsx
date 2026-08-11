import type { Meta, StoryObj } from "@storybook/react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

const meta = {
  title: "Components/ForgotPasswordForm",
  component: ForgotPasswordForm,
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
} satisfies Meta<typeof ForgotPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNavigation: Story = {
  args: { onBackToLogin: () => {} },
};

export const Loading: Story = {
  args: { isLoading: true },
};

export const ServerError: Story = {
  args: { serverError: "Something went wrong" },
};

export const Success: Story = {
  args: { serverSuccess: "Check your email for a reset link" },
};
