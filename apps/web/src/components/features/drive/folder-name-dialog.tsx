import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface FolderNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  initialName?: string;
  onConfirm: (name: string) => void;
}

export function FolderNameDialog({
  open,
  onOpenChange,
  title,
  initialName = "",
  onConfirm,
}: FolderNameDialogProps) {
  const { t } = useLingui();
  const [value, setValue] = useState(initialName);

  useEffect(() => {
    if (open) setValue(initialName);
  }, [open, initialName]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onConfirm(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <Input autoFocus value={value} onChange={(event) => setValue(event.target.value)} />
          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" />}
            >{t`Cancel`}</DialogClose>
            <Button type="submit">{t`Save`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
