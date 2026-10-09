import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import type { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DirtyGuardDialog({
  isDirty,
  onOpenChange,
  ...props
}: Omit<DialogPrimitive.Root.Props, "onOpenChange"> & {
  isDirty: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLingui();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Dialog
        {...props}
        onOpenChange={(open, details) => {
          if (!open && isDirty) {
            details.cancel();
            setConfirmOpen(true);
            return;
          }
          onOpenChange(open);
        }}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t`Discard changes?`}
        description={t`Your unsaved changes will be lost.`}
        confirmLabel={t`Discard`}
        cancelLabel={t`Keep editing`}
        variant="destructive"
        onConfirm={() => onOpenChange(false)}
      />
    </>
  );
}
