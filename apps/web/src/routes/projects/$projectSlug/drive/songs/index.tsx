import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/drive/songs/")({
  staticData: { title: "Songs", breadcrumb: "Songs" },
});
