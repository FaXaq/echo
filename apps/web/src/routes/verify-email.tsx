import { useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { GalleryVerticalEnd } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import { FieldError } from "@/components/ui/field";
import { translateDynamic } from "@/lib/dynamic-messages";
import { useVerifyEmailMutation } from "@/services/resources/auth";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  staticData: { title: "Verify email" },
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (!search.token) {
      throw redirect({ to: "/" });
    }
  },
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const { t } = useLingui();
  const verifyEmailMutation = useVerifyEmailMutation();

  useEffect(() => {
    if (token) verifyEmailMutation.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
          <div className="flex flex-col items-center gap-4 text-center">
            {verifyEmailMutation.isSuccess ? (
              <p>
                <Trans>Your email has been verified. You can now sign in.</Trans>
              </p>
            ) : verifyEmailMutation.isError ? (
              <FieldError>{translateDynamic(t, verifyEmailMutation.error.message)}</FieldError>
            ) : (
              <p>
                <Trans>Verifying your email...</Trans>
              </p>
            )}
            <a href="/" className="text-foreground underline underline-offset-4 hover:opacity-80">
              <Trans>Back to login</Trans>
            </a>
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
