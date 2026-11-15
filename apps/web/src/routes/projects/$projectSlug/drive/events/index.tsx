import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/drive/events/")({
  staticData: { title: "Events", breadcrumb: "Events" },
});
