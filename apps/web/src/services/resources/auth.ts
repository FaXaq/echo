import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth";
import { getSessionQueryOptions } from "./session";

export function useSignInEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data, error } = await authClient.signIn.email(input);
      if (error) throw new Error(error.message ?? "Login failed");
      return data;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: getSessionQueryOptions().queryKey });
    },
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SignUpEmailInput) => {
      const { data, error } = await authClient.signUp.email(input);
      if (error) throw new Error(error.message ?? "Sign up failed");
      return data;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: getSessionQueryOptions().queryKey });
    },
  });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.signOut();
      if (error) throw new Error(error.message ?? "Logout failed");
      return data;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: getSessionQueryOptions().queryKey });
    },
  });
}

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: async (input: { email: string; redirectTo: string }) => {
      const { data, error } = await authClient.requestPasswordReset(input);
      if (error) throw new Error(error.message ?? "Failed to send reset email");
      return data;
    },
  });
}

export function useResendVerificationEmailMutation() {
  return useMutation({
    mutationFn: async (input: { email: string }) => {
      const { data, error } = await authClient.sendVerificationEmail(input);
      if (error) throw new Error(error.message ?? "Failed to resend verification email");
      return data;
    },
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: async (input: { token: string }) => {
      const { data, error } = await authClient.verifyEmail({ query: input });
      if (error) throw new Error(error.message ?? "Email verification failed");
      return data;
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async (input: { token: string; newPassword: string }) => {
      const { data, error } = await authClient.resetPassword(input);
      if (error) throw new Error(error.message ?? "Password reset failed");
      return data;
    },
  });
}

export function useAcceptInvitationMutation() {
  return useMutation({
    mutationFn: async (input: { invitationId: string }) => {
      const { data, error } = await authClient.organization.acceptInvitation(input);
      if (error) throw new Error(error.message ?? "Failed to accept invitation");
      return data;
    },
  });
}

export type UpdateUserInput = Parameters<typeof authClient.updateUser>[0];
export function useUpdateUserMutation() {
  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const { data, error } = await authClient.updateUser(input);
      if (error) throw new Error(error.message ?? "Failed to update user");
      return data;
    },
  });
}
