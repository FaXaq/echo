import { useState } from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm, type LoginFormValues } from "@/components/login-form";
import { SignupForm, type SignupFormValues } from "@/components/signup-form";
import {
  ForgotPasswordForm,
  type ForgotPasswordFormValues,
} from "@/components/forgot-password-form";
import { useRouter } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";
import { logger } from "@/lib/logger";
import { toast } from "@/components/ui/toast";
import {
  useSignInEmailMutation,
  useSignUpEmailMutation,
  useRequestPasswordResetMutation,
  useResendVerificationEmailMutation,
} from "@/services/resources/auth";

type View = "login" | "signup" | "forgot-password";

export const Landing = () => {
  const { t } = useLingui();
  const [view, setView] = useState<View>("login");
  const [serverError, setServerError] = useState<string | undefined>();
  const [serverSuccess, setServerSuccess] = useState<string | undefined>();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | undefined>();
  const router = useRouter();
  const signInEmailMutation = useSignInEmailMutation();
  const signUpEmailMutation = useSignUpEmailMutation();
  const requestPasswordResetMutation = useRequestPasswordResetMutation();
  const resendVerificationEmailMutation = useResendVerificationEmailMutation();

  const isLoading =
    signInEmailMutation.isPending ||
    signUpEmailMutation.isPending ||
    requestPasswordResetMutation.isPending;

  const handleLogin = (values: LoginFormValues) => {
    setServerError(undefined);
    setServerSuccess(undefined);
    setUnverifiedEmail(undefined);

    signInEmailMutation.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: async () => {
          await router.invalidate();
          router.navigate({ to: "/" });
        },
        onError: (error) => {
          setServerError(error.message);
          if (error.message === "Email not verified") {
            setUnverifiedEmail(values.email);
          }
        },
      },
    );
  };

  const handleResendVerification = () => {
    if (!unverifiedEmail) return;

    resendVerificationEmailMutation.mutate(
      { email: unverifiedEmail },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: t`Verification email sent` });
        },
        onError: (error) => {
          setServerError(error.message);
        },
      },
    );
  };

  const handleSignup = (values: SignupFormValues) => {
    setServerError(undefined);
    setServerSuccess(undefined);

    signUpEmailMutation.mutate(
      {
        name: values.name,
        username: values.username,
        email: values.email,
        password: values.password,
        locale: navigator.language.split("-")[0] ?? "en",
      },
      {
        onSuccess: () => {
          setServerSuccess("Check your email to verify your account");
        },
        onError: (error) => {
          logger.error(error);
          setServerError(error.message);
        },
      },
    );
  };

  const handleForgotPassword = (values: ForgotPasswordFormValues) => {
    setServerError(undefined);
    setServerSuccess(undefined);

    requestPasswordResetMutation.mutate(
      { email: values.email, redirectTo: "/reset-password" },
      {
        onSuccess: () => {
          setServerSuccess("Check your email for a password reset link");
        },
        onError: (error) => {
          setServerError(error.message);
        },
      },
    );
  };

  const switchView = (next: View) => {
    setServerError(undefined);
    setServerSuccess(undefined);
    setUnverifiedEmail(undefined);
    setView(next);
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Acme Inc.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {view === "login" ? (
              <LoginForm
                onSubmit={handleLogin}
                onSignupClick={() => switchView("signup")}
                onForgotPasswordClick={() => switchView("forgot-password")}
                isLoading={isLoading}
                serverError={serverError}
                showResendVerification={!!unverifiedEmail}
                onResendVerification={handleResendVerification}
                isResendingVerification={resendVerificationEmailMutation.isPending}
              />
            ) : view === "signup" ? (
              <SignupForm
                onSubmit={handleSignup}
                onLoginClick={() => switchView("login")}
                isLoading={isLoading}
                serverError={serverError}
                serverSuccess={serverSuccess}
              />
            ) : (
              <ForgotPasswordForm
                onSubmit={handleForgotPassword}
                onBackToLogin={() => switchView("login")}
                isLoading={isLoading}
                serverError={serverError}
                serverSuccess={serverSuccess}
              />
            )}
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};
