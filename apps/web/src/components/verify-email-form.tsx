import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { translateDynamic } from "@/lib/dynamic-messages";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { RefreshCwIcon } from "lucide-react";

const schema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});

export type VerifyEmailFormValues = z.infer<typeof schema>;

export interface VerifyEmailFormProps {
  email: string;
  onSubmit: (values: VerifyEmailFormValues) => Promise<void> | void;
  onResend: () => void;
  isLoading?: boolean;
  isResending?: boolean;
  serverError?: string;
  serverSuccess?: string;
  className?: string;
}

export function VerifyEmailForm({
  email,
  onSubmit,
  onResend,
  isLoading = false,
  isResending = false,
  serverError,
  serverSuccess,
  className,
}: VerifyEmailFormProps) {
  const { t } = useLingui();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { otp: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("flex flex-col gap-6", className)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">
            <Trans>Verify your email</Trans>
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            <Trans>We've sent a one-time code to {email}</Trans>
          </p>
        </div>

        {serverError && <FieldError>{translateDynamic(t, serverError)}</FieldError>}
        {serverSuccess && (
          <p className="rounded-md bg-green-50 p-3 text-center text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            {translateDynamic(t, serverSuccess)}
          </p>
        )}

        <Field>
          <div className="flex flex-row justify-center">
            <Controller
              name="otp"
              control={control}
              render={({ field }) => (
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} aria-invalid={!!errors.otp} />
                    <InputOTPSlot index={1} aria-invalid={!!errors.otp} />
                    <InputOTPSlot index={2} aria-invalid={!!errors.otp} />
                    <InputOTPSlot index={3} aria-invalid={!!errors.otp} />
                    <InputOTPSlot index={4} aria-invalid={!!errors.otp} />
                    <InputOTPSlot index={5} aria-invalid={!!errors.otp} />
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
          </div>
          {errors.otp && (
            <FieldError className="text-center">
              {translateDynamic(t, errors.otp.message!)}
            </FieldError>
          )}
        </Field>

        <div className="flex flex-row gap-2">
          <Field>
            <Button type="button" variant="outline" onClick={onResend} isLoading={isResending}>
              <RefreshCwIcon />
              <Trans>Resend code</Trans>
            </Button>
          </Field>
          <Field>
            <Button type="submit" isLoading={isLoading}>
              <Trans>Verify</Trans>
            </Button>
          </Field>
        </div>
      </FieldGroup>
    </form>
  );
}
