import { useState } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm, type LoginFormValues } from "@/components/login-form";
import { useSignInEmailMutation, useSendVerificationOtpMutation } from "@/services/resources/auth";
import { getSessionQueryOptions } from "@/services/resources/session";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  staticData: { title: "Login" },
  validateSearch: searchSchema,
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(getSessionQueryOptions());
    if (session) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | undefined>();
  const signInEmailMutation = useSignInEmailMutation();
  const sendVerificationOtpMutation = useSendVerificationOtpMutation();

  const handleLogin = (values: LoginFormValues) => {
    setServerError(undefined);

    signInEmailMutation.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => {
          setTimeout(async () => {
            await router.invalidate();
            router.navigate({ to: redirect ?? "/" });
          }, 600);
        },
        onError: (error) => {
          if (error.message === "Email not verified") {
            sendVerificationOtpMutation.mutate(
              { email: values.email },
              {
                onSuccess: () => {
                  router.navigate({
                    to: "/verify-email",
                    search: { email: values.email, redirect },
                  });
                },
                onError: (sendError) => setServerError(sendError.message),
              },
            );
            return;
          }
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
            Acme Inc.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm
              onSubmit={handleLogin}
              onSignupClick={() => router.navigate({ to: "/signup", search: { redirect } })}
              onForgotPasswordClick={() =>
                router.navigate({ to: "/forgot-password", search: { redirect } })
              }
              isLoading={signInEmailMutation.isPending || sendVerificationOtpMutation.isPending}
              serverError={serverError}
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
