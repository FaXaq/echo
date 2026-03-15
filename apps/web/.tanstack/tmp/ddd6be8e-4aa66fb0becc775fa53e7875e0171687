import { useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Trans, useTranslation } from "react-i18next"
import { authClient } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_auth-guard/organizations/new")({
  component: NewOrganizationPage,
})

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
})

type FormValues = z.infer<typeof schema>

function NewOrganizationPage() {
  const { t } = useTranslation("projects")
  const router = useRouter()
  const [serverError, setServerError] = useState<string | undefined>()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    setValue("slug", slug)
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(undefined)
    const result = await authClient.organization.create({
      name: values.name,
      slug: values.slug,
    })

    if (result.error) {
      setServerError(result.error.message ?? "Failed to create organization")
    } else {
      router.navigate({ to: "/" })
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold">
                <Trans t={t}>New project</Trans>
              </h1>
              <p className="text-sm text-muted-foreground">
                <Trans t={t}>Create a space for your project</Trans>
              </p>
            </div>

            {serverError && <FieldError>{t(serverError)}</FieldError>}

            <Field>
              <FieldLabel htmlFor="name">
                <Trans t={t}>Name</Trans>
              </FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="My Project"
                className="bg-background"
                {...register("name", { onChange: handleNameChange })}
              />
              {errors.name && (
                <FieldError>{t(errors.name.message!)}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="slug">
                <Trans t={t}>Slug</Trans>
              </FieldLabel>
              <Input
                id="slug"
                type="text"
                placeholder="my-project"
                className="bg-background"
                {...register("slug")}
              />
              {errors.slug && (
                <FieldError>{t(errors.slug.message!)}</FieldError>
              )}
            </Field>

            <Field>
              <Button type="submit" isLoading={isSubmitting}>
                <Trans t={t}>Create organization</Trans>
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
