import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { translateDynamic } from "@/lib/dynamic-messages";

const schema = z
  .object({
    password: z.string().superRefine((val, ctx) => {
      const add = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });

      if (val.length < 12) add("At least 12 characters");
      if (val.length > 72) add("Maximum 72 characters");
      if (!/[A-Z]/.test(val)) add("At least one uppercase letter");
      if (!/[a-z]/.test(val)) add("At least one lowercase letter");
      if (!/[0-9]/.test(val)) add("At least one number");
      if (!/[^A-Za-z0-9]/.test(val)) add("At least one special character");
    }),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof schema>;

export interface ResetPasswordFormProps {
  onSubmit: (values: ResetPasswordFormValues) => Promise<void> | void;
  isLoading?: boolean;
  serverError?: string;
  className?: string;
}

export function ResetPasswordForm({
  onSubmit,
  isLoading = false,
  serverError,
  className,
}: ResetPasswordFormProps) {
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">
            <Trans>Set a new password</Trans>
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            <Trans>Choose a strong password for your account</Trans>
          </p>
        </div>

        {serverError && <FieldError>{translateDynamic(t, serverError)}</FieldError>}

        <Field>
          <FieldLabel htmlFor="password">
            <Trans>New password</Trans>
          </FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            className="bg-background"
            {...register("password")}
          />
          {errors.password && (
            <FieldError>{translateDynamic(t, errors.password.message!)}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">
            <Trans>Confirm password</Trans>
          </FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="bg-background"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <FieldError>{translateDynamic(t, errors.confirmPassword.message!)}</FieldError>
          )}
        </Field>

        <Field>
          <Button type="submit" isLoading={isLoading}>
            <Trans>Reset password</Trans>
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
