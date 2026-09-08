import { useState } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { GalleryVerticalEnd } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { SignupForm, type SignupFormValues } from "@/components/signup-form";
import { logger } from "@/lib/logger";
import { useSignUpEmailMutation } from "@/services/resources/auth";
import { getSessionQueryOptions } from "@/services/resources/session";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/signup")({
  staticData: { title: "Sign up" },
  validateSearch: searchSchema,
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(getSessionQueryOptions());
    if (session) throw redirect({ to: "/" });
  },
  component: SignupPage,
});

function SignupPage() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const posthog = usePostHog();
  const [serverError, setServerError] = useState<string | undefined>();
  const signUpEmailMutation = useSignUpEmailMutation();

  const handleSignup = (values: SignupFormValues) => {
    setServerError(undefined);

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
          posthog.capture("account_signed_up");
          router.navigate({ to: "/verify-email", search: { email: values.email, redirect } });
        },
        onError: (error) => {
          logger.error(error);
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
            <SignupForm
              onSubmit={handleSignup}
              onLoginClick={() => router.navigate({ to: "/login", search: { redirect } })}
              isLoading={signUpEmailMutation.isPending}
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
