import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/")({
  component: () => <RouteComponent />,
});

function RouteComponent() {
  return (
    <div>
      <h1></h1>
    </div>
  );
}
