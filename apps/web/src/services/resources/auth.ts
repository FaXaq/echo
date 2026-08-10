import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth";

export function useSignInEmailMutation() {
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => authClient.signIn.email(input),
  });
}

export function useSignInUsernameMutation() {
  return useMutation({
    mutationFn: (input: { username: string; password: string }) =>
      authClient.signIn.username(input),
  });
}

export type SignUpEmailInput = {
  name: string;
  username: string;
  email: string;
  password: string;
  locale: string;
};
export function useSignUpEmailMutation() {
  return useMutation({
    mutationFn: (input: SignUpEmailInput) => authClient.signUp.email(input),
  });
}

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: (input: { email: string; redirectTo: string }) =>
      authClient.requestPasswordReset(input),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: { token: string; newPassword: string }) => authClient.resetPassword(input),
  });
}

export function useAcceptInvitationMutation() {
  return useMutation({
    mutationFn: (input: { invitationId: string }) =>
      authClient.organization.acceptInvitation(input),
  });
}

export type UpdateUserInput = Parameters<typeof authClient.updateUser>[0];
export function useUpdateUserMutation() {
  return useMutation({
    mutationFn: (input: UpdateUserInput) => authClient.updateUser(input),
  });
}
