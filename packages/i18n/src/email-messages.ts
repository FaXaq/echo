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
  verifyEmailSubject: { id: "email.verifyEmail.subject", message: "Verify your Echo email" },
  verifyEmailBody: {
    id: "email.verifyEmail.body",
    message: "Confirm your email address to finish creating your Echo account.",
  },
  verifyEmailButton: { id: "email.verifyEmail.button", message: "Verify my email" },
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
  "email.verifyEmail.subject": "Vérifiez votre adresse e-mail Echo",
  "email.verifyEmail.body":
    "Confirmez votre adresse e-mail pour terminer la création de votre compte Echo.",
  "email.verifyEmail.button": "Vérifier mon e-mail",
};
