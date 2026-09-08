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
      queryClient.clear();
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
      queryClient.clear();
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
      queryClient.clear();
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

export function useSendVerificationOtpMutation() {
  return useMutation({
    mutationFn: async (input: { email: string }) => {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email: input.email,
        type: "email-verification",
      });
      if (error) throw new Error(error.message ?? "Failed to send verification code");
      return data;
    },
  });
}

export function useVerifyEmailOtpMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; otp: string }) => {
      const { data, error } = await authClient.emailOtp.verifyEmail(input);
      if (error) throw new Error(error.message ?? "Email verification failed");
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const { data, error } = await authClient.updateUser(input);
      if (error) throw new Error(error.message ?? "Failed to update user");
      return data;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: getSessionQueryOptions().queryKey });
    },
  });
}
