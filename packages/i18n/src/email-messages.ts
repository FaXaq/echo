import type { MessageDescriptor } from "@lingui/core";

export const emailMessages = {
  resetPasswordSubject: { id: "email.resetPassword.subject", message: "Reset your Echo password" },
  resetPasswordBody: {
    id: "email.resetPassword.body",
    message: "You requested a password reset.",
  },
  resetPasswordButton: { id: "email.resetPassword.button", message: "Reset my password" },
  invitationSubject: {
    id: "email.invitation.subject",
    message: "Invitation to join {orgName}",
  },
  invitationBody: {
    id: "email.invitation.body",
    message: "You have been invited to join {orgName}",
  },
  invitationButton: { id: "email.invitation.button", message: "Accept invitation" },
} satisfies Record<string, MessageDescriptor>;
