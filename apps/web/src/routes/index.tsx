import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "../lib/trpc";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const health = trpc.health.useQuery();

  return (
    <div>
      <h1>Echo</h1>
      <p>API status: {health.data?.status ?? "loading..."}</p>
    </div>
  );
}
