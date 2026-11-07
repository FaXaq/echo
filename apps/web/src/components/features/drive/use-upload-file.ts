import { useQueryClient } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { usePostHog } from "posthog-js/react";
import { toast } from "@/components/ui/toast";
import { useUploadFileMutation } from "@/services/resources/drive";
import { setSongAudioVersion } from "@/services/resources/song";

export function formatUploadDestination(segments: (string | undefined)[]) {
  return segments.filter(Boolean).join(" / ");
}

export function useUploadFile() {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useUploadFileMutation({
    onSuccess: async (uploaded, input) => {
      const fileName = input.file.name;
      posthog.capture("drive_file_uploaded", { file_type: input.file.type });
      toast.add({
        type: "success",
        title: t`${fileName} uploaded`,
        description: input.destinationLabel,
      });

      if (!input.songId || !input.songAudioRole) return;
      try {
        await setSongAudioVersion(queryClient, {
          songId: input.songId,
          organizationId: input.organizationId,
          fileId: uploaded.id,
          role: input.songAudioRole,
        });
        toast.add({
          type: "success",
          title: input.songAudioRole === "demo" ? t`Set as latest demo` : t`Set as latest final`,
        });
      } catch {
        toast.add({ type: "error", title: t`Failed to set audio version` });
      }
    },
  });
}
