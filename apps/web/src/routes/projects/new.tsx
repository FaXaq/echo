import { useState } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trans, useLingui } from "@lingui/react/macro";
import { TRPCClientError } from "@trpc/client";
import { useSession } from "@/hooks/use-session";
import { useCreateOrganizationMutation } from "@/services/resources/organization";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { translateDynamic } from "@/lib/dynamic-messages";

export const Route = createFileRoute("/projects/new")({
  staticData: { title: "New project", breadcrumb: "New project" },
  component: NewOrganizationPage,
});

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
});

type FormValues = z.infer<typeof schema>;

function NewOrganizationPage() {
  const { t } = useLingui();
  const { session } = useSession();
  const router = useRouter();
  const posthog = usePostHog();
  const [serverError, setServerError] = useState<string | undefined>();
  const createOrganizationMutation = useCreateOrganizationMutation();

  if (!session) {
    throw redirect({ to: "/" });
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) => {
    setServerError(undefined);
    createOrganizationMutation.mutate(values, {
      onSuccess: (res) => {
        posthog.capture("project_created");
        router.navigate({ to: "/projects/$projectSlug", params: { projectSlug: res.slug } });
      },
      onError: (error) => {
        setServerError(
          error instanceof TRPCClientError ? error.message : "Failed to create project",
        );
      },
    });
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold">
                <Trans>New project</Trans>
              </h1>
              <p className="text-sm text-muted-foreground">
                <Trans>Create a space for your project</Trans>
              </p>
            </div>

            {serverError && <FieldError>{translateDynamic(t, serverError)}</FieldError>}

            <Field>
              <FieldLabel htmlFor="name">
                <Trans>Name</Trans>
              </FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder={t`My Project`}
                className="bg-background"
                {...register("name")}
              />
              {errors.name && <FieldError>{translateDynamic(t, errors.name.message!)}</FieldError>}
            </Field>

            <Field>
              <Button type="submit" isLoading={createOrganizationMutation.isPending}>
                <Trans>Create project</Trans>
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
