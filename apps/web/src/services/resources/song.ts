import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterInputs, RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";
import { getSongFilesQueryOptions } from "./drive";

const { key, getResourceKey } = initResourceKey("song");

export { key };

export type Song = RouterOutputs["song"]["listSongs"][number];
export type SongAudioVersions = RouterOutputs["song"]["getAudioVersions"];
export type SongAudioVersion = SongAudioVersions["demo"][number];

export function getSongsQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listSongs", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.song.listSongs.query(params, { signal });
    },
  });
}

export function getSongSearchQueryOptions(opts: { organizationId: string; query: string }) {
  return queryOptions({
    queryKey: getResourceKey("searchSongs", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.song.searchSongs.query(params, { signal });
    },
  });
}

export function getSongQueryOptions(opts: { songId: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("getSongById", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.song.getSongById.query(params, { signal });
    },
  });
}

export function getSongAudioVersionsQueryOptions(opts: { songId: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("getAudioVersions", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.song.getAudioVersions.query(params, { signal });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getSongDefaultAudioQueryOptions(opts: { songId: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("getDefaultAudio", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.song.getDefaultAudio.query(params, { signal });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetSongAudioVersionMutation({
  songId,
  organizationId,
  onSuccess,
  onError,
}: {
  songId: string;
  organizationId: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { fileId: string; role: "demo" | "final" }) =>
      apiClient.song.setAudioVersion.mutate({ songId, organizationId, ...input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getSongAudioVersionsQueryOptions({ songId, organizationId }).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: getSongDefaultAudioQueryOptions({ songId, organizationId }).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: getSongFilesQueryOptions({ songId, organizationId }).queryKey,
        }),
      ]);
      onSuccess?.();
    },
    onError,
  });
}

export function useClearSongAudioVersionMutation({
  songId,
  organizationId,
  onSuccess,
  onError,
}: {
  songId: string;
  organizationId: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { fileId: string }) =>
      apiClient.song.clearAudioVersion.mutate({ songId, organizationId, ...input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getSongAudioVersionsQueryOptions({ songId, organizationId }).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: getSongDefaultAudioQueryOptions({ songId, organizationId }).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: getSongFilesQueryOptions({ songId, organizationId }).queryKey,
        }),
      ]);
      onSuccess?.();
    },
    onError,
  });
}

export type CreateSongInput = RouterInputs["song"]["createSong"];
export function useCreateSongMutation({ onSuccess }: { onSuccess?: (song: Song) => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSongInput) => apiClient.song.createSong.mutate(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export type UpdateSongInput = RouterInputs["song"]["updateSong"];
export function useUpdateSongMutation({ onSuccess }: { onSuccess?: (song: Song) => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSongInput) => apiClient.song.updateSong.mutate(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export function useUpdateSongLyricsMutation({
  organizationId,
  onSuccess,
  onError,
}: {
  organizationId: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; lyrics: string | null }) =>
      apiClient.song.updateSongLyrics.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
    onError,
  });
}

export function useDeleteSongMutation({
  organizationId,
  onSuccess,
}: {
  organizationId: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string }) =>
      apiClient.song.deleteSong.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}
