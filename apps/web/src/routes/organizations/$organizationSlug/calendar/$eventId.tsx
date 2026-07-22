import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  EventDetail,
  EventDialog,
  type EventDialogState,
} from '@/ui/event-calendar'
import type { CalendarEvent as ViewEvent } from '@/ui/event-calendar'
import {
  key as calendarKey,
  getOrganizationEventsQueryOptions,
  updateOrganizationEvent,
  deleteOrganizationEvent,
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
  const queryClient = useQueryClient()
  const { data: events = [] } = useQuery(
    getOrganizationEventsQueryOptions({ organizationId }),
  )
  const [dialogState, setDialogState] = useState<EventDialogState>(null)

  const event = events.find((e) => e.id === eventId)

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: calendarKey })

  const goBack = () =>
    navigate({
      to: '/organizations/$organizationSlug/calendar',
      params: { organizationSlug },
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
    await deleteOrganizationEvent({ id, organizationId })
    refresh()
    goBack()
  }

  const handleSubmit = async (updated: ViewEvent) => {
    await updateOrganizationEvent({
      id: updated.id,
      organizationId,
      ...fromViewEvent(updated),
    })
    refresh()
    setDialogState(null)
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
      />
    </div>
  )
}
