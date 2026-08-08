import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SuspendedEventDetail } from '@/components/features/event-calendar/suspended-event-detail'

export const Route = createFileRoute(
  '/organizations/$organizationSlug/calendar/$eventId',
)({
  staticData: { breadcrumb: 'Event details' },
  component: OrganizationEventDetailPage,
})

function OrganizationEventDetailPage() {
  const { organizationSlug, eventId } = Route.useParams()
  const { organizationId } = Route.useRouteContext()
  const navigate = useNavigate()

  const goBack = () =>
    navigate({
      to: '/organizations/$organizationSlug/calendar',
      params: { organizationSlug },
    })

  return (
    <div className="p-6 h-full">
      <SuspendedEventDetail eventId={eventId} organizationId={organizationId} onBack={goBack} />
    </div>
  )
}
