import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Toggle } from "@/components/ui/toggle";
import { songTypeSchema, type SongType } from "@echo/modules/song/domain";
import type { Song } from "@/services/resources/song";

const songFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string(),
  bpm: z.string().refine((v) => v === "" || /^\d+$/.test(v), "BPM must be a whole number"),
  key: z.string(),
  type: songTypeSchema,
});

type SongFormValues = z.infer<typeof songFormSchema>;

export type SongDialogState = { mode: "create" } | { mode: "edit"; song: Song } | null;

export interface SongDialogSubmitValues {
  title: string;
  artist?: string;
  bpm?: number;
  key?: string;
  type: SongType;
}

function stateToDefaultValues(state: SongDialogState): SongFormValues {
  if (state?.mode === "edit") {
    const { song } = state;
    return {
      title: song.title,
      artist: song.artist ?? "",
      bpm: song.bpm != null ? String(song.bpm) : "",
      key: song.key ?? "",
      type: song.type ?? "original",
    };
  }
  return { title: "", artist: "", bpm: "", key: "", type: "original" };
}

interface SongDialogProps {
  state: SongDialogState;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SongDialogSubmitValues) => void | Promise<void>;
}

export function SongDialog({ state, onOpenChange, onSubmit }: SongDialogProps) {
  const { t } = useLingui();

  const [content, setContent] = useState(state);
  useEffect(() => {
    if (state !== null) setContent(state);
  }, [state]);

  const isEdit = content?.mode === "edit";

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SongFormValues>({
    resolver: zodResolver(songFormSchema),
    defaultValues: stateToDefaultValues(content),
  });

  useEffect(() => {
    if (state !== null) reset(stateToDefaultValues(state));
  }, [state, reset]);

  const submit = async (values: SongFormValues) => {
    await onSubmit({
      title: values.title,
      artist: values.artist || undefined,
      bpm: values.bpm ? Number(values.bpm) : undefined,
      key: values.key || undefined,
      type: values.type,
    });
  };

  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t`Edit song` : t`New song`}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t`Edit song` : t`New song`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="song-title">{t`Title`}</FieldLabel>
              <Input id="song-title" autoFocus {...register("title")} />
              <FieldError>{errors.title && translateDynamic(t, errors.title.message!)}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="song-artist">{t`Artist`}</FieldLabel>
              <Input id="song-artist" {...register("artist")} />
            </Field>

            <div className="flex gap-3">
              <Field className="flex-1">
                <FieldLabel htmlFor="song-bpm">{t`BPM`}</FieldLabel>
                <Input id="song-bpm" inputMode="numeric" {...register("bpm")} />
                <FieldError>{errors.bpm && translateDynamic(t, errors.bpm.message!)}</FieldError>
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="song-key">{t`Key`}</FieldLabel>
                <Input id="song-key" {...register("key")} />
              </Field>
            </div>

            <Field>
              <FieldLabel>{t`Type`}</FieldLabel>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-1.5">
                    <Toggle
                      pressed={field.value === "original"}
                      onPressedChange={() => field.onChange("original")}
                      className="rounded-full"
                    >
                      {t`Original`}
                    </Toggle>
                    <Toggle
                      pressed={field.value === "cover"}
                      onPressedChange={() => field.onChange("cover")}
                      className="rounded-full"
                    >
                      {t`Cover`}
                    </Toggle>
                  </div>
                )}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isSubmitting} />}
            >
              {t`Cancel`}
            </DialogClose>
            <Button type="submit" isLoading={isSubmitting}>
              {isEdit ? t`Save changes` : t`Create song`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
