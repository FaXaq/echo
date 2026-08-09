import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trans, useTranslation } from "react-i18next";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof schema>;

export interface ForgotPasswordFormProps {
  onSubmit: (values: ForgotPasswordFormValues) => Promise<void> | void;
  onBackToLogin?: () => void;
  isLoading?: boolean;
  serverError?: string;
  serverSuccess?: string;
  className?: string;
}

export function ForgotPasswordForm({
  onSubmit,
  onBackToLogin,
  isLoading = false,
  serverError,
  serverSuccess,
  className,
}: ForgotPasswordFormProps) {
  const { t } = useTranslation("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">
            <Trans t={t}>Forgot your password?</Trans>
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            <Trans t={t}>Enter your email to receive a reset link</Trans>
          </p>
        </div>

        {serverError && <FieldError>{t(serverError)}</FieldError>}

        {serverSuccess ? (
          <p className="rounded-md bg-green-50 p-3 text-center text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            {t(serverSuccess)}
          </p>
        ) : (
          <Field>
            <FieldLabel htmlFor="email">
              <Trans t={t}>Email</Trans>
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              autoComplete="email"
              className="bg-background"
              {...register("email")}
            />
            {errors.email && <FieldError>{t(errors.email.message!)}</FieldError>}
          </Field>
        )}

        {!serverSuccess && (
          <Field>
            <Button type="submit" isLoading={isLoading}>
              <Trans t={t}>Send reset link</Trans>
            </Button>
          </Field>
        )}

        {onBackToLogin && (
          <p className="text-center text-sm text-muted-foreground">
            <Trans t={t}>
              <button
                type="button"
                className="text-foreground underline underline-offset-4 hover:opacity-80"
                onClick={onBackToLogin}
              >
                Back to login
              </button>
            </Trans>
          </p>
        )}
      </FieldGroup>
    </form>
  );
}
