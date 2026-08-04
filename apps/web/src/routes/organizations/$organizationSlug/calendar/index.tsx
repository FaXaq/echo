import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { EventCalendar } from '@/ui/event-calendar'
import type { CalendarEvent as ViewEvent } from '@/ui/event-calendar'
import {
  getEventsQueryOptions,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from '@/services/resources/calendar'
import { toViewEvent, fromViewEvent } from '@/lib/calendar-events'

export const Route = createFileRoute(
  '/organizations/$organizationSlug/calendar/',
)({
  staticData: { breadcrumb: 'Calendar' },
  component: OrganizationCalendarPage,
})

function OrganizationCalendarPage() {
  const { t } = useTranslation('calendar')
  const { organizationId } = Route.useRouteContext()
  const { organizationSlug } = Route.useParams()
  const navigate = useNavigate()
  const { data: events = [] } = useQuery(getEventsQueryOptions({ organizationId }))

  const createEventMutation = useCreateEventMutation({ organizationId })
  const updateEventMutation = useUpdateEventMutation({ organizationId })
  const deleteEventMutation = useDeleteEventMutation({ organizationId })

  const handleEventCreate = async (event: ViewEvent) => {
    await createEventMutation.mutateAsync(fromViewEvent(event))
  }

  const handleEventUpdate = async (event: ViewEvent) => {
    await updateEventMutation.mutateAsync({ id: event.id, ...fromViewEvent(event) })
  }

  const handleEventDelete = async (id: string) => {
    await deleteEventMutation.mutateAsync({ id })
  }

  const handleEventClick = (event: ViewEvent) => {
    navigate({
      to: '/organizations/$organizationSlug/calendar/$eventId',
      params: { organizationSlug, eventId: event.id },
    })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('Schedule')}</h1>
        <p className="text-muted-foreground">
          {t("Manage your organization's events and schedule")}
        </p>
      </div>
      <EventCalendar
        events={events.map(toViewEvent)}
        onEventClick={handleEventClick}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        className="flex-1"
      />
    </div>
  )
}
