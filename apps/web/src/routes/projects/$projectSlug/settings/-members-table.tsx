import { useLingui } from "@lingui/react/macro";
import {
  useCancelInvitationMutation,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
} from "@/services/resources/member";
import { Button } from "@/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Badge } from "@/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/ui/alert-dialog";
import {
  canUpdateOrgMemberRole,
  canRevokeMembership,
  canCancelInvitation,
} from "@echo/modules/user/domain";
import type { OrganizationRole, ClientMember, ClientInvitation } from "@echo/auth";
import { logger } from "@/lib/logger";
import { translateDynamic } from "@/lib/dynamic-messages";
import { toast } from "@/components/ui/toast";

interface MembersTableProps {
  members: ClientMember[];
  invitations: ClientInvitation[];
  currentMemberRole: OrganizationRole | null;
  currentUserId: string | null;
  organizationId: string;
}

export function MembersTable({
  members,
  invitations,
  currentMemberRole,
  currentUserId,
  organizationId,
}: MembersTableProps) {
  const { t } = useLingui();
  const cancelInvitationMutation = useCancelInvitationMutation();
  const removeMemberMutation = useRemoveMemberMutation();
  const updateMemberRoleMutation = useUpdateMemberRoleMutation();
  const isLoading =
    cancelInvitationMutation.isPending ||
    removeMemberMutation.isPending ||
    updateMemberRoleMutation.isPending;

  const handleCancelInvitation = (invitationId: string) => {
    cancelInvitationMutation.mutate(
      { invitationId },
      {
        onSuccess: () => toast.add({ title: t`Invitation sent`, type: "success" }),
        onError: (error) => {
          toast.add({ title: t`Failed to cancel invitation`, type: "error" });
          logger.error(error, "Failed to cancel invitation:");
        },
      },
    );
  };

  const handleRevoke = (memberId: string) => {
    removeMemberMutation.mutate(
      { memberIdOrEmail: memberId, organizationId },
      {
        onSuccess: () => toast.add({ title: t`Member removed`, type: "success" }),
        onError: (error) => {
          toast.add({ title: t`Failed to revoke membership`, type: "error" });
          logger.error(error, "Failed to revoke membership:");
        },
      },
    );
  };

  const handleUpdateRole = (memberId: string, role: OrganizationRole) => {
    updateMemberRoleMutation.mutate(
      { memberId, role, organizationId },
      {
        onSuccess: () => toast.add({ title: t`Role updated`, type: "success" }),
        onError: (error) => {
          toast.add({ title: t`Failed to update member role`, type: "error" });
          logger.error(error, "Failed to update member role:");
        },
      },
    );
  };

  const hasMembers = members.length > 0 || invitations.length > 0;

  return (
    <div className="mb-8">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t`Name`}</TableHead>
            <TableHead>{t`Email`}</TableHead>
            <TableHead>{t`Role`}</TableHead>
            <TableHead className="w-24">{t`Actions`}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length > 0 &&
            invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{"-"}</TableCell>
                <TableCell>{invitation.email || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="mr-2">
                    {translateDynamic(t, invitation.role)}
                  </Badge>
                  <Badge variant="secondary">{t`Pending`}</Badge>
                </TableCell>
                <TableCell>
                  {canCancelInvitation(currentMemberRole) ? (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="destructive" size="sm" disabled={isLoading} />}
                      >
                        {t`Cancel`}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t`Cancel invitation`}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t`Are you sure you want to cancel this invitation?`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t`No, keep it`}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancelInvitation(invitation.id)}>
                            {t`Yes, cancel`}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          {members.length > 0
            ? members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.user.name}</TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>
                    {canUpdateOrgMemberRole(currentMemberRole) &&
                    member.userId !== currentUserId ? (
                      <Select
                        value={member.role}
                        onValueChange={(role) =>
                          handleUpdateRole(member.id, role as OrganizationRole)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue>
                            {(role: OrganizationRole) => translateDynamic(t, role)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">{translateDynamic(t, "member")}</SelectItem>
                          <SelectItem value="admin">{translateDynamic(t, "admin")}</SelectItem>
                          {currentMemberRole === "owner" && (
                            <SelectItem value="owner">{translateDynamic(t, "owner")}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{translateDynamic(t, member.role)}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {canRevokeMembership(currentMemberRole, member.role as OrganizationRole) &&
                    member.userId !== currentUserId ? (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={<Button variant="destructive" size="sm" disabled={isLoading} />}
                        >
                          {t`Revoke`}
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t`Revoke membership`}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t`Are you sure you want to remove this member from the project?`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t`No, keep them`}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRevoke(member.id)}>
                              {t`Yes, remove`}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            : null}
          {!hasMembers && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                {t`No members yet`}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
