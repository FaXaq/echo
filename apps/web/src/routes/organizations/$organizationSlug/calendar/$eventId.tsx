import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  EventDetail,
  EventDialog,
  type EventDialogState,
} from '@/ui/event-calendar'
import type { CalendarEvent as ViewEvent } from '@/ui/event-calendar'
import {
  getOrganizationEventsQueryOptions,
  useUpdateOrganizationEventMutation,
  useDeleteOrganizationEventMutation,
} from '@/services/resources/calendar'
import { toViewEvent, fromViewEvent } from '@/lib/calendar-events'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute(
  '/organizations/$organizationSlug/calendar/$eventId',
)({
  staticData: { breadcrumb: 'Event details' },
  component: OrganizationEventDetailPage,
})

function OrganizationEventDetailPage() {
  const { t } = useTranslation('calendar')
  const { organizationSlug, eventId } = Route.useParams()
  const { organizationId } = Route.useRouteContext()
  const navigate = useNavigate()
  const { data: events = [] } = useQuery(
    getOrganizationEventsQueryOptions({ organizationId }),
  )
  const [dialogState, setDialogState] = useState<EventDialogState>(null)

  const event = events.find((e) => e.id === eventId)

  const goBack = () =>
    navigate({
      to: '/organizations/$organizationSlug/calendar',
      params: { organizationSlug },
    })

  const updateEventMutation = useUpdateOrganizationEventMutation({
    organizationId,
    onSuccess: () => setDialogState(null),
  })
  const deleteEventMutation = useDeleteOrganizationEventMutation({
    organizationId,
    onSuccess: goBack,
  })

  if (!event) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">{t('Event not found')}</h1>
        <p className="text-muted-foreground">
          {t("This event doesn't exist or has been deleted.")}
        </p>
        <Button type="button" onClick={goBack}>
          {t('Back to calendar')}
        </Button>
      </div>
    )
  }

  const viewEvent = toViewEvent(event)

  const handleDelete = async (id: string) => {
    await deleteEventMutation.mutateAsync({ id })
  }

  const handleSubmit = async (updated: ViewEvent) => {
    await updateEventMutation.mutateAsync({ id: updated.id, ...fromViewEvent(updated) })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <EventDetail
        event={viewEvent}
        onEdit={() => setDialogState({ mode: 'edit', event: viewEvent })}
        onDelete={() => handleDelete(viewEvent.id)}
        onBack={goBack}
      />
      <EventDialog
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        organizationId={organizationId}
      />
    </div>
  )
}
