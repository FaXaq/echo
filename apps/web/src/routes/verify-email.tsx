import { useState } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { GalleryVerticalEnd } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { VerifyEmailForm, type VerifyEmailFormValues } from "@/components/verify-email-form";
import {
  useSendVerificationOtpMutation,
  useVerifyEmailOtpMutation,
} from "@/services/resources/auth";
import { toast } from "@/components/ui/toast";

const searchSchema = z.object({
  email: z.string().optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  staticData: { title: "Verify email" },
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (!search.email) {
      throw redirect({ to: "/" });
    }
  },
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email, redirect: redirectTo } = Route.useSearch();
  const { t } = useLingui();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | undefined>();
  const [serverSuccess, setServerSuccess] = useState<string | undefined>();
  const verifyEmailOtpMutation = useVerifyEmailOtpMutation();
  const sendVerificationOtpMutation = useSendVerificationOtpMutation();

  const handleVerify = (values: VerifyEmailFormValues) => {
    if (!email) return;
    setServerError(undefined);
    setServerSuccess(undefined);

    verifyEmailOtpMutation.mutate(
      { email, otp: values.otp },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: t`Email verified` });
          // this is needed to avoid a race-condition when creating a personnal org
          // & setting it before redirecting the user
          setTimeout(async () => {
            await router.invalidate();
            router.navigate({ to: redirectTo ?? "/" });
          }, 600);
        },
        onError: (error) => setServerError(error.message),
      },
    );
  };

  const handleResend = () => {
    if (!email) return;
    setServerError(undefined);
    setServerSuccess(undefined);

    sendVerificationOtpMutation.mutate(
      { email },
      {
        onSuccess: () => setServerSuccess("A new code has been sent"),
        onError: (error) => setServerError(error.message),
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
            <VerifyEmailForm
              email={email ?? ""}
              onSubmit={handleVerify}
              onResend={handleResend}
              isLoading={verifyEmailOtpMutation.isPending}
              isResending={sendVerificationOtpMutation.isPending}
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
