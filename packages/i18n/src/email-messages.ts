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

// These ids live outside apps/web/src, so `lingui extract` never finds them and
// would mark any .po entry for them as obsolete. Translations are kept here by
// hand instead, and merged into the server-side catalog in index.ts.
export const emailTranslationsFr: Record<string, string> = {
  "email.resetPassword.subject": "Réinitialisez votre mot de passe Echo",
  "email.resetPassword.body": "Vous avez demandé une réinitialisation de mot de passe.",
  "email.resetPassword.button": "Réinitialiser mon mot de passe",
  "email.invitation.subject": "Invitation à rejoindre {orgName}",
  "email.invitation.body": "Vous avez été invité(e) à rejoindre {orgName}",
  "email.invitation.button": "Accepter l'invitation",
};
