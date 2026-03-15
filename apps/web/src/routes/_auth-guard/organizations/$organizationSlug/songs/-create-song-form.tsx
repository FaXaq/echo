import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

const createSongSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z.string().optional(),
});

type CreateSongFormValues = z.infer<typeof createSongSchema>;

interface CreateSongFormProps {
  organizationSlug: string;
  onSuccess?: () => void;
}

export function CreateSongForm({
  organizationSlug,
  onSuccess,
}: CreateSongFormProps) {
  const { t } = useTranslation("songs");
  const createSong = trpc.organization.song.create.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<CreateSongFormValues>({
    resolver: zodResolver(createSongSchema),
  });

  const onSubmit = async (values: CreateSongFormValues) => {
    try {
      await createSong.mutateAsync({
        organizationSlug,
        name: values.name,
        key: values.key || null,
      });
      reset();
      onSuccess?.();
    } catch (e) {
      setError("root", { message: t("Failed to create song") });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          {t("Name")}
        </label>
        <Input
          id="name"
          placeholder={t("Name")}
          {...register("name")}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{t(errors.name.message!)}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="key" className="text-sm font-medium">
          {t("Key")}
        </label>
        <Input
          id="key"
          placeholder="C major, Am..."
          {...register("key")}
          disabled={isSubmitting}
        />
      </div>

      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("Creating...") : t("Create")}
      </Button>
    </form>
  );
}
