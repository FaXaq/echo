import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLingui } from "@lingui/react/macro";

import { translateDynamic } from "@/lib/dynamic-messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const playlistFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
});

type PlaylistFormValues = z.infer<typeof playlistFormSchema>;

export interface PlaylistDialogSubmitValues {
  title: string;
  description?: string;
}

interface PlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PlaylistDialogSubmitValues) => void | Promise<void>;
}

export function PlaylistDialog({ open, onOpenChange, onSubmit }: PlaylistDialogProps) {
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistFormSchema),
    defaultValues: { title: "", description: "" },
  });

  const submit = async (values: PlaylistFormValues) => {
    await onSubmit({ title: values.title, description: values.description || undefined });
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t`New playlist`}</DialogTitle>
          <DialogDescription className="sr-only">{t`New playlist`}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="playlist-title">{t`Title`}</FieldLabel>
              <Input id="playlist-title" autoFocus {...register("title")} />
              <FieldError>{errors.title && translateDynamic(t, errors.title.message!)}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="playlist-description">{t`Description`}</FieldLabel>
              <Textarea id="playlist-description" {...register("description")} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isSubmitting} />}
            >
              {t`Cancel`}
            </DialogClose>
            <Button type="submit" isLoading={isSubmitting}>
              {t`Create playlist`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
