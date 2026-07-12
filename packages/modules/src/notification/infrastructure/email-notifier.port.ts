export interface EmailNotifierPort {
  sendUserInvitationToJoinOrganization: (opts: {
    to: string;
    orgName: string;
    invitationId: string;
  }) => Promise<void>;

  sendUserResetPassword: (opts: { to: string; token: string }) => Promise<void>;
}
