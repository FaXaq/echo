import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trans, useTranslation } from "react-i18next";

const schema = z.object({
  login: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof schema>;

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  onSignupClick?: () => void;
  onForgotPasswordClick?: () => void;
  isLoading?: boolean;
  serverError?: string;
  className?: string;
}

export function LoginForm({
  onSubmit,
  onSignupClick,
  onForgotPasswordClick,
  isLoading = false,
  serverError,
  className,
}: LoginFormProps) {
  const { t } = useTranslation("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">
            <Trans t={t}>Login to your account</Trans>
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            <Trans t={t}>Enter your email or username to login</Trans>
          </p>
        </div>

        {serverError && <FieldError>{t(serverError)}</FieldError>}

        <Field>
          <FieldLabel htmlFor="login">
            <Trans t={t}>Email or username</Trans>
          </FieldLabel>
          <Input
            id="login"
            type="text"
            placeholder="m@example.com"
            autoComplete="username"
            className="bg-background"
            {...register("login")}
          />
          {errors.login && <FieldError>{t(errors.login.message!)}</FieldError>}
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">
              <Trans t={t}>Password</Trans>
            </FieldLabel>
            {onForgotPasswordClick ? (
              <button
                type="button"
                className="ml-auto text-sm underline-offset-4 hover:underline"
                onClick={onForgotPasswordClick}
              >
                <Trans t={t}>Forgot your password?</Trans>
              </button>
            ) : (
              <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
                <Trans t={t}>Forgot your password?</Trans>
              </a>
            )}
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="bg-background"
            {...register("password")}
          />
          {errors.password && <FieldError>{t(errors.password.message!)}</FieldError>}
        </Field>

        <Field>
          <Button type="submit" isLoading={isLoading}>
            <Trans t={t}>Login</Trans>
          </Button>
        </Field>

        {onSignupClick && (
          <p className="text-center text-sm text-muted-foreground">
            <Trans t={t}>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-foreground underline underline-offset-4 hover:opacity-80"
                onClick={onSignupClick}
              >
                Sign up
              </button>
            </Trans>
          </p>
        )}
      </FieldGroup>
    </form>
  );
}
