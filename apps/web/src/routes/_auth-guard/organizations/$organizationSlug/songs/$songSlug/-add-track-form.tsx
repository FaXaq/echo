import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@echo/api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Track = RouterOutput["organization"]["track"]["list"][number];

const addTrackSchema = z.object({
  name: z.string().min(1, "Track name is required"),
});

type AddTrackFormValues = z.infer<typeof addTrackSchema>;

interface AddTrackFormProps {
  songId: string;
  onTrackAdded: (track: Track) => void;
}

export function AddTrackForm({ songId, onTrackAdded }: AddTrackFormProps) {
  const { t } = useTranslation("songs");
  const createTrack = trpc.organization.track.create.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<AddTrackFormValues>({
    resolver: zodResolver(addTrackSchema),
  });

  const onSubmit = async (values: AddTrackFormValues) => {
    try {
      const track = await createTrack.mutateAsync({
        songId,
        name: values.name,
      });
      reset();
      onTrackAdded(track);
    } catch {
      setError("root", { message: t("Failed to add track") });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-start">
      <div className="flex-1">
        <Input
          placeholder={t("Track name")}
          {...register("name")}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">
            {t(errors.name.message!)}
          </p>
        )}
        {errors.root && (
          <p className="text-sm text-destructive mt-1">{errors.root.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {t("Add track")}
      </Button>
    </form>
  );
}
