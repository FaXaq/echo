import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterInputs, RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("song");

export { key };

export type Song = RouterOutputs["song"]["listSongs"][number];

export function getSongsQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listSongs", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.song.listSongs.query(params, { signal });
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
