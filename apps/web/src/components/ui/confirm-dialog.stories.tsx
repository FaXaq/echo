import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

function ConfirmDialogDemo({ variant }: { variant: "default" | "destructive" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant === "destructive" ? "destructive" : "outline"}
        onClick={() => setOpen(true)}
      >
        {variant === "destructive" ? "Delete Account" : "Continue"}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        variant={variant}
        title={variant === "destructive" ? "Delete Account" : "Are you sure?"}
        description={
          variant === "destructive"
            ? "This will permanently delete your account and remove all associated data. This action cannot be undone."
            : "This action cannot be undone. This will permanently delete your data."
        }
        confirmLabel={variant === "destructive" ? "Delete Account" : "Continue"}
        onConfirm={() => {}}
      />
    </>
  );
}

const meta = {
  title: "UI/ConfirmDialog",
  component: ConfirmDialog,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const noopArgs = {
  open: false,
  onOpenChange: () => {},
  title: "",
  description: "",
  confirmLabel: "",
  onConfirm: () => {},
};

export const Default: Story = {
  args: noopArgs,
  render: () => <ConfirmDialogDemo variant="default" />,
};

export const Destructive: Story = {
  args: noopArgs,
  render: () => <ConfirmDialogDemo variant="destructive" />,
};
