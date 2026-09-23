import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SuspendedOutreachCardDetail } from "@/components/features/outreach/suspended-outreach-card-detail";

export const Route = createFileRoute("/projects/$projectSlug/outreach/$cardId")({
  staticData: { title: "Outreach card", breadcrumb: "Outreach card" },
  component: OrganizationOutreachCardDetailPage,
});

function OrganizationOutreachCardDetailPage() {
  const { projectSlug, cardId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const navigate = useNavigate();

  const goBack = () => navigate({ to: "/projects/$projectSlug/outreach", params: { projectSlug } });

  return (
    <div className="p-6 h-full">
      <SuspendedOutreachCardDetail
        cardId={cardId}
        organizationId={organizationId}
        pathname={`/${projectSlug}/outreach/${cardId}`}
        onBack={goBack}
      />
    </div>
  );
}
