import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterInputs, RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("playlist");

export { key };

export type Playlist = RouterOutputs["playlist"]["listPlaylists"][number];
export type PlaylistSongEntry = RouterOutputs["playlist"]["listPlaylistSongs"][number];
export type PlaylistSummary = RouterOutputs["playlist"]["listEventPlaylists"][number];

export function getPlaylistsQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listPlaylists", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.playlist.listPlaylists.query(params, { signal });
    },
  });
}

export function getPlaylistQueryOptions(opts: { playlistId: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("getPlaylistById", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.playlist.getPlaylistById.query(params, { signal });
    },
  });
}

export function getPlaylistSongsQueryOptions(opts: { playlistId: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listPlaylistSongs", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.playlist.listPlaylistSongs.query(params, { signal });
    },
  });
}

export function getPlaylistSearchQueryOptions(opts: { organizationId: string; query: string }) {
  return queryOptions({
    queryKey: getResourceKey("searchPlaylists", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.playlist.searchPlaylists.query(params, { signal });
    },
  });
}

export function getEventPlaylistsQueryOptions(opts: { eventId: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listEventPlaylists", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.playlist.listEventPlaylists.query(params, { signal });
    },
  });
}

export type CreatePlaylistInput = RouterInputs["playlist"]["createPlaylist"];
export function useCreatePlaylistMutation({
  onSuccess,
}: { onSuccess?: (playlist: Playlist) => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePlaylistInput) => apiClient.playlist.createPlaylist.mutate(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export function useDeletePlaylistMutation({
  organizationId,
  onSuccess,
}: {
  organizationId: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string }) =>
      apiClient.playlist.deletePlaylist.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}

export function useAddSongToPlaylistMutation({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { playlistId: string; songId: string }) =>
      apiClient.playlist.addSongToPlaylist.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useRemoveSongFromPlaylistMutation({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { playlistId: string; songId: string }) =>
      apiClient.playlist.removeSongFromPlaylist.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useAttachPlaylistToEventMutation({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { playlistId: string; eventId: string }) =>
      apiClient.playlist.attachPlaylistToEvent.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDetachPlaylistFromEventMutation({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { playlistId: string; eventId: string }) =>
      apiClient.playlist.detachPlaylistFromEvent.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
