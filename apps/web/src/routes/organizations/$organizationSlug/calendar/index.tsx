import { createFileRoute } from '@tanstack/react-router'

import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EventCalendar } from '@/ui/event-calendar'
import type { CalendarEvent as ViewEvent } from '@/ui/event-calendar'
import {
  key as calendarKey,
  getOrganizationEventsQueryOptions,
  createOrganizationEvent,
  updateOrganizationEvent,
  deleteOrganizationEvent,
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
  const queryClient = useQueryClient()
  const { data: events = [] } = useQuery(getOrganizationEventsQueryOptions({ organizationId }))

  const refresh = () => queryClient.invalidateQueries({ queryKey: calendarKey })

  const handleEventCreate = async (event: ViewEvent) => {
    await createOrganizationEvent({ organizationId, ...fromViewEvent(event) })
    refresh()
  }

  const handleEventUpdate = async (event: ViewEvent) => {
    await updateOrganizationEvent({ id: event.id, organizationId, ...fromViewEvent(event) })
    refresh()
  }

  const handleEventDelete = async (id: string) => {
    await deleteOrganizationEvent({ id, organizationId })
    refresh()
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
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        className="flex-1"
      />
    </div>
  )
}
