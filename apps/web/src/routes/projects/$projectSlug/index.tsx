import { createFileRoute, Link } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { CalendarPlus, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  SuspendedLastEvent,
  SuspendedMyBalance,
  SuspendedRecentFiles,
  SuspendedRecentMedia,
  SuspendedRecentPlaylists,
  SuspendedRecentSongs,
  SuspendedUpcomingEvents,
} from "@/components/features/home/suspended-home-sections";

export const Route = createFileRoute("/projects/$projectSlug/")({
  component: RouteComponent,
});

// Columns collapse to `contents` on mobile so every section joins one flex column ordered by `order-*`.
const column = "contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4";

function RouteComponent() {
  const { organizationId, organizationName } = Route.useRouteContext();
  const { projectSlug } = Route.useParams();
  const props = { organizationId, projectSlug };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{organizationName}</span>
          <h1 className="m-0 font-heading text-3xl font-semibold tracking-tight">
            <Trans>Home</Trans>
          </h1>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Link
            to="/projects/$projectSlug/drive"
            params={{ projectSlug }}
            className={buttonVariants({ variant: "outline" })}
          >
            <Upload />
            <Trans>Upload a file</Trans>
          </Link>
          <Link
            to="/projects/$projectSlug/calendar"
            params={{ projectSlug }}
            className={buttonVariants()}
          >
            <CalendarPlus />
            <Trans>New event</Trans>
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:items-start">
        <div className={column}>
          <SuspendedUpcomingEvents {...props} className="order-1" />
          <SuspendedRecentSongs {...props} className="order-5" />
          <SuspendedRecentPlaylists {...props} className="order-7" />
        </div>
        <div className={column}>
          <SuspendedLastEvent {...props} className="order-3" />
          <SuspendedRecentFiles {...props} className="order-6" />
        </div>
        <div className={column}>
          <SuspendedMyBalance {...props} className="order-2" />
          <SuspendedRecentMedia {...props} className="order-4" />
        </div>
      </div>
    </div>
  );
}
