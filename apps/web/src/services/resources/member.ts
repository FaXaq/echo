import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth";
import type { OrganizationRole } from "@echo/auth";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("member");

export { key };

export function listMembersQueryOptions(opts: {
  organizationId: string;
  isPersonal: boolean;
  limit: number;
  offset: number;
}) {
  return queryOptions({
    queryKey: getResourceKey("list", opts),
    queryFn: async () => {
      if (opts.isPersonal)
        return {
          members: [],
          total: 0,
        } satisfies Awaited<ReturnType<(typeof authClient)["organization"]["listMembers"]>>;
      const { data, error } = await authClient.organization.listMembers({
        query: {
          organizationId: opts.organizationId,
          limit: opts.limit,
          offset: opts.offset,
          sortBy: "createdAt",
        },
      });
      if (error) throw new Error(`Failed to list members: ${error.message}`);
      return data;
    },
  });
}

export function listInvitationsQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listInvitations", opts),
    queryFn: async () => {
      const { data, error } = await authClient.organization.listInvitations({
        query: { organizationId: opts.organizationId },
      });
      if (error) throw new Error(`Failed to list invitations: ${error.message}`);
      return (data ?? []).filter((invitation) => invitation.status === "pending");
    },
  });
}

export type InviteMemberInput = {
  organizationId: string;
  email: string;
  role: "member" | "admin";
};
export function useInviteMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      const { data, error } = await authClient.organization.inviteMember(input);
      if (error) throw new Error(error.message ?? "Failed to invite member");
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useCancelInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opts: { invitationId: string }) => {
      const { error } = await authClient.organization.cancelInvitation(opts);
      if (error) throw new Error(error.message ?? "Failed to cancel invitation");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opts: { memberIdOrEmail: string; organizationId: string }) => {
      const { error } = await authClient.organization.removeMember(opts);
      if (error) throw new Error(error.message ?? "Failed to remove member");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useUpdateMemberRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opts: {
      memberId: string;
      role: OrganizationRole;
      organizationId: string;
    }) => {
      const { error } = await authClient.organization.updateMemberRole(opts);
      if (error) throw new Error(error.message ?? "Failed to update member role");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
