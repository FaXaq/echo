import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/drive")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/drive"!</div>;
}
