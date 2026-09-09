import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { GalleryVerticalEnd } from "lucide-react";
import {
  ForgotPasswordForm,
  type ForgotPasswordFormValues,
} from "@/components/forgot-password-form";
import { useRequestPasswordResetMutation } from "@/services/resources/auth";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/forgot-password")({
  staticData: { title: "Forgot password" },
  validateSearch: searchSchema,
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | undefined>();
  const [serverSuccess, setServerSuccess] = useState<string | undefined>();
  const requestPasswordResetMutation = useRequestPasswordResetMutation();

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

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Echo
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <ForgotPasswordForm
              onSubmit={handleForgotPassword}
              onBackToLogin={() => router.navigate({ to: "/login", search: { redirect } })}
              isLoading={requestPasswordResetMutation.isPending}
              serverError={serverError}
              serverSuccess={serverSuccess}
            />
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
}
