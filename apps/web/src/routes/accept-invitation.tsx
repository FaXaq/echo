import { useState } from "react"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { z } from "zod"
import { GalleryVerticalEnd } from "lucide-react"
import { authClient } from "@/lib/auth"
import { Trans, useTranslation } from "react-i18next"
import { trpcLoader } from "@/lib/trpc"
import dayjs from "dayjs"
import { Landing } from "./-landing"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

const searchSchema = z.object({
  id: z.string().optional(),
})

export const Route = createFileRoute("/accept-invitation")({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (!search.id) {
      throw redirect({ to: "/" })
    }
  },
  loaderDeps: ({ search: { id } }) => ({ id }),
  loader: async ({ deps }) => {
    if (!deps.id) {
      return { invitation: null }
    }

    const invitation = await trpcLoader.invitation.get.query({
      id: deps.id
    })

    const { data: session } = await authClient.getSession();

    return { invitation, session };
  },
  component: AcceptInvitationPage,
})

function AcceptInvitationPage() {
  const { invitation, session } = Route.useLoaderData()
  const { t } = useTranslation("members")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  if (!invitation) {
    return <p>
      <Trans t={t}>Cannot find the invitation you're looking for</Trans>
    </p>
  }

  if (invitation.status !== "pending" || dayjs(invitation.expiresAt).isBefore(dayjs())) {
    return <p>
      <Trans t={t}>Invitation has expired or already been processed. Please, request a new one.</Trans>
    </p>
  }

  if (!session) {
    return <Landing />
  }

  const handleAccept = async () => {
    setIsLoading(true)
    setServerError(undefined)
    try {
      const result = await authClient.organization.acceptInvitation({
        invitationId: invitation.id,
      })
      if (result.error) {
        setServerError(result.error.message ?? t("Failed to accept invitation"))
      } else {
        router.navigate({ to: "/" })
      }
    } finally {
      setIsLoading(false)
    }
  }

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
            <p>
              <Trans t={t}>You have been invited to join</Trans>{" "}
              <strong>{invitation.organizationName}</strong>
            </p>
            {serverError && <FieldError>{t(serverError)}</FieldError>}
            <Button onClick={handleAccept} isLoading={isLoading}>
              <Trans t={t}>Accept invitation</Trans>
            </Button>
            <a href="/">{t("Back to home")}</a>
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
  )
}
