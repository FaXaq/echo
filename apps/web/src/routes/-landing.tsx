import { useState } from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm, type LoginFormValues } from "@/components/login-form";
import { SignupForm, type SignupFormValues } from "@/components/signup-form";
import {
  ForgotPasswordForm,
  type ForgotPasswordFormValues,
} from "@/components/forgot-password-form";
import { useRouter } from "@tanstack/react-router";
import { logger } from "@/lib/logger";
import {
  useSignInEmailMutation,
  useSignInUsernameMutation,
  useSignUpEmailMutation,
  useRequestPasswordResetMutation,
} from "@/services/resources/auth";

type View = "login" | "signup" | "forgot-password";

export const Landing = () => {
  const [view, setView] = useState<View>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>();
  const [serverSuccess, setServerSuccess] = useState<string | undefined>();
  const router = useRouter();
  const signInEmailMutation = useSignInEmailMutation();
  const signInUsernameMutation = useSignInUsernameMutation();
  const signUpEmailMutation = useSignUpEmailMutation();
  const requestPasswordResetMutation = useRequestPasswordResetMutation();

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    setServerError(undefined);

    try {
      const isEmail = values.login.includes("@");

      const result = isEmail
        ? await signInEmailMutation.mutateAsync({
            email: values.login,
            password: values.password,
          })
        : await signInUsernameMutation.mutateAsync({
            username: values.login,
            password: values.password,
          });

      if (result.error) {
        setServerError(result.error.message ?? "Login failed");
      }
    } finally {
      setIsLoading(false);
      router.invalidate();
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
    setIsLoading(true);
    setServerError(undefined);

    try {
      const result = await signUpEmailMutation.mutateAsync({
        name: values.name,
        username: values.username,
        email: values.email,
        password: values.password,
        locale: navigator.language.split("-")[0] ?? "en",
      });

      if (result.error) {
        logger.error(result.error);
        setServerError(result.error.message ?? "Sign up failed");
      }
    } finally {
      setIsLoading(false);
      router.invalidate();
    }
  };

  const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setServerError(undefined);
    setServerSuccess(undefined);

    try {
      const result = await requestPasswordResetMutation.mutateAsync({
        email: values.email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        setServerError(result.error.message ?? "Failed to send reset email");
      } else {
        setServerSuccess("Check your email for a password reset link");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchView = (next: View) => {
    setServerError(undefined);
    setServerSuccess(undefined);
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
              />
            ) : view === "signup" ? (
              <SignupForm
                onSubmit={handleSignup}
                onLoginClick={() => switchView("login")}
                isLoading={isLoading}
                serverError={serverError}
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
