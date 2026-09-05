import { useState } from "react";
import type React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";
import { UploadCloud } from "lucide-react";
import { SuspendedEventDetail } from "@/components/features/event-calendar/suspended-event-detail";
import {
  EventUploadProvider,
  useEventUploadMutation,
} from "@/components/features/event-calendar/event-upload-context";

export const Route = createFileRoute("/projects/$projectSlug/calendar/$eventId")({
  staticData: { title: "Event details", breadcrumb: "Event details" },
  component: OrganizationEventDetailPage,
});

function OrganizationEventDetailPage() {
  const { projectSlug, eventId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const navigate = useNavigate();

  const goBack = () =>
    navigate({
      to: "/projects/$projectSlug/calendar",
      params: { projectSlug },
    });

  return (
    <EventUploadProvider>
      <EventDropZone eventId={eventId} organizationId={organizationId}>
        <SuspendedEventDetail
          eventId={eventId}
          organizationId={organizationId}
          pathname={`/${projectSlug}/calendar/${eventId}`}
          onBack={goBack}
        />
      </EventDropZone>
    </EventUploadProvider>
  );
}

function EventDropZone({
  eventId,
  organizationId,
  children,
}: {
  eventId: string;
  organizationId: string;
  children: React.ReactNode;
}) {
  const { t } = useLingui();
  const [isDragging, setIsDragging] = useState(false);
  const uploadMutation = useEventUploadMutation();

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    Array.from(event.dataTransfer.files).forEach((file) => {
      uploadMutation.mutate({ eventId, organizationId, file });
    });
  };

  return (
    <div
      className="relative p-6 h-full"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary bg-background/90">
          <UploadCloud className="size-8 text-primary" />
          <p className="text-sm font-medium text-primary">{t`Drop files to upload`}</p>
        </div>
      )}
    </div>
  );
}
