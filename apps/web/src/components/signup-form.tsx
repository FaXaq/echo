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
    name: z.string().min(1, "Full name is required"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ and - only"),
    email: z.string().email("Invalid email address"),
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

export type SignupFormValues = z.infer<typeof schema>;

export interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => Promise<void> | void;
  onLoginClick?: () => void;
  isLoading?: boolean;
  serverError?: string;
  className?: string;
}

export function SignupForm({
  onSubmit,
  onLoginClick,
  isLoading = false,
  serverError,
  className,
}: SignupFormProps) {
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">
            <Trans>Create an account</Trans>
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            <Trans>Fill in the details below to get started</Trans>
          </p>
        </div>

        {serverError && <FieldError>{translateDynamic(t, serverError)}</FieldError>}

        <Field>
          <FieldLabel htmlFor="name">
            <Trans>Full name</Trans>
          </FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            className="bg-background"
            {...register("name")}
          />
          {errors.name && <FieldError>{translateDynamic(t, errors.name.message!)}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="username">
            <Trans>Username</Trans>
          </FieldLabel>
          <Input
            id="username"
            type="text"
            placeholder="johndoe"
            autoComplete="username"
            className="bg-background"
            {...register("username")}
          />
          {errors.username && (
            <FieldError>{translateDynamic(t, errors.username.message!)}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">
            <Trans>Email</Trans>
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            className="bg-background"
            {...register("email")}
          />
          {errors.email && <FieldError>{translateDynamic(t, errors.email.message!)}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">
            <Trans>Password</Trans>
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
            <Trans>Create account</Trans>
          </Button>
        </Field>

        {onLoginClick && (
          <p className="text-center text-sm text-muted-foreground">
            <Trans>
              Already have an account?{" "}
              <button
                type="button"
                className="text-foreground underline underline-offset-4 hover:opacity-80"
                onClick={onLoginClick}
              >
                Sign in
              </button>
            </Trans>
          </p>
        )}
      </FieldGroup>
    </form>
  );
}
