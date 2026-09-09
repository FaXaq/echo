import { createFileRoute } from "@tanstack/react-router";
import posthog from "posthog-js";
import { signOut } from "@/services/resources/auth";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/logout")({
  staticData: { title: "Log out" },
  loader: async () => {
    await signOut();
    posthog.reset();
    // Hard navigation to avoid race condition
    window.location.href = "/";
  },
  pendingComponent: LogoutPending,
});

function LogoutPending() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}
