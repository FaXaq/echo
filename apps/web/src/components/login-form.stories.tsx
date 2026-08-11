import type { Meta, StoryObj } from "@storybook/react";
import { LoginForm } from "@/components/login-form";

const meta = {
  title: "Components/LoginForm",
  component: LoginForm,
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
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNavigation: Story = {
  args: { onSignupClick: () => {}, onForgotPasswordClick: () => {} },
};

export const Loading: Story = {
  args: { isLoading: true },
};

export const ServerError: Story = {
  args: { serverError: "Invalid email or password" },
};
