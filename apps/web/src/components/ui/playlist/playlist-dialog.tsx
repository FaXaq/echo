import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLingui } from "@lingui/react/macro";

import { translateDynamic } from "@/lib/dynamic-messages";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DirtyGuardDialog } from "@/components/ui/dirty-guard-dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Playlist } from "@/services/resources/playlist";

const playlistFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

type PlaylistFormValues = z.infer<typeof playlistFormSchema>;

export type PlaylistDialogState = { mode: "create" } | { mode: "edit"; playlist: Playlist } | null;

export interface PlaylistDialogSubmitValues {
  title: string;
}

function stateToDefaultValues(state: PlaylistDialogState): PlaylistFormValues {
  if (state?.mode === "edit") return { title: state.playlist.title };
  return { title: "" };
}

interface PlaylistDialogProps {
  state: PlaylistDialogState;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PlaylistDialogSubmitValues) => void | Promise<void>;
}

export function PlaylistDialog({ state, onOpenChange, onSubmit }: PlaylistDialogProps) {
  const { t } = useLingui();

  const [content, setContent] = useState(state);
  useEffect(() => {
    if (state !== null) setContent(state);
  }, [state]);

  const isEdit = content?.mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistFormSchema),
    defaultValues: stateToDefaultValues(content),
  });

  useEffect(() => {
    if (state !== null) reset(stateToDefaultValues(state));
  }, [state, reset]);

  const submit = async (values: PlaylistFormValues) => {
    await onSubmit({ title: values.title });
  };

  return (
    <DirtyGuardDialog open={state !== null} onOpenChange={onOpenChange} isDirty={isDirty}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t`Edit playlist` : t`New playlist`}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t`Edit playlist` : t`New playlist`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="playlist-title">{t`Title`}</FieldLabel>
              <Input id="playlist-title" autoFocus {...register("title")} />
              <FieldError>{errors.title && translateDynamic(t, errors.title.message!)}</FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isSubmitting} />}
            >
              {t`Cancel`}
            </DialogClose>
            <Button type="submit" isLoading={isSubmitting}>
              {isEdit ? t`Save changes` : t`Create playlist`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DirtyGuardDialog>
  );
}
