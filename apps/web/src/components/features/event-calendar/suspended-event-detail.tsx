import { Suspense, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { useSuspenseQuery } from "@tanstack/react-query"
import { TRPCClientError } from "@trpc/client"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EventDetail, EventDialog, type EventDialogState } from "@/ui/event-calendar"
import {
  getEventQueryOptions,
  useDeleteEventMutation,
  useUpdateEventMutation,
} from "@/services/resources/calendar"
import { fromViewEvent, toViewEvent } from "@/lib/calendar-events"
import { SuspendedEventAttachments } from "./suspended-event-attachments"

export interface SuspendedEventDetailProps {
  eventId: string
  organizationId?: string
  onBack: () => void
}

function EventDetailContent({ eventId, organizationId, onBack }: SuspendedEventDetailProps) {
  const { t } = useTranslation("calendar")
  const { data: event } = useSuspenseQuery(getEventQueryOptions({ eventId, organizationId }))
  const viewEvent = toViewEvent(event)
  const [dialogState, setDialogState] = useState<EventDialogState>(null)

  const updateEventMutation = useUpdateEventMutation({
    organizationId,
    onSuccess: () => setDialogState(null),
  })
  const deleteEventMutation = useDeleteEventMutation({
    organizationId,
    onSuccess: () => {
      toast.success(t("Event deleted"))
      onBack()
    },
  })

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success(t("Link copied to clipboard"))
  }

  const handleSubmit = async (updated: typeof viewEvent) => {
    await updateEventMutation.mutateAsync({ id: updated.id, ...fromViewEvent(updated) })
  }

  const handleDelete = async () => {
    await deleteEventMutation.mutateAsync({ id: viewEvent.id })
  }

  return (
    <>
      <EventDetail
        event={viewEvent}
        onShare={handleShare}
        onEdit={() => setDialogState({ mode: "edit", event: viewEvent })}
        onDelete={handleDelete}
        attachments={<SuspendedEventAttachments eventId={viewEvent.id} organizationId={organizationId} />}
      />
      <EventDialog
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </>
  )
}

function EventDetailSkeleton() {
  return (
    <div className="flex flex-wrap-reverse gap-9">
      <div className="flex min-w-[280px] flex-[999_1_400px] flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex min-w-[200px] max-w-[280px] flex-[1_1_220px] flex-col gap-2">
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

function EventDetailError({ error, onBack }: { error: unknown; onBack: () => void }) {
  const { t } = useTranslation("calendar")
  const isNotFound = error instanceof TRPCClientError && error.data?.code === "NOT_FOUND"

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">{isNotFound ? t("Event not found") : t("Something went wrong")}</h1>
      {isNotFound && (
        <p className="text-muted-foreground">{t("This event doesn't exist or has been deleted.")}</p>
      )}
      <Button type="button" onClick={onBack}>
        {t("Back to calendar")}
      </Button>
    </div>
  )
}

export function SuspendedEventDetail({ eventId, organizationId, onBack }: SuspendedEventDetailProps) {
  return (
    <ErrorBoundary fallbackRender={({ error }) => <EventDetailError error={error} onBack={onBack} />}>
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetailContent eventId={eventId} organizationId={organizationId} onBack={onBack} />
      </Suspense>
    </ErrorBoundary>
  )
}
