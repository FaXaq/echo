import { createFileRoute, redirect } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { isOrganizationAdmin } from "@echo/modules/user/domain";
import type { OrganizationRole } from "@echo/auth";
import { getActiveMemberRoleQueryOptions } from "@/services/resources/session";
import { SuspendedOrganizationSettings } from "@/components/features/organization/suspended-organization-settings";
import z from "zod";

export const Route = createFileRoute("/projects/$projectSlug/settings/")({
  staticData: { title: "Settings", breadcrumb: "Settings" },
  validateSearch: z.object({
    limit: z.number().default(25),
    offset: z.number().default(0),
  }),
  beforeLoad: async ({ context }) => {
    const { organizationId, queryClient } = context;

    let currentMemberRole: OrganizationRole | null = null;
    try {
      const { role } = await queryClient.ensureQueryData(
        getActiveMemberRoleQueryOptions({ organizationId }),
      );
      currentMemberRole = role;
    } catch {
      currentMemberRole = null;
    }

    if (!isOrganizationAdmin(currentMemberRole)) throw redirect({ to: "/" });

    return { currentMemberRole };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { organizationId, currentMemberRole } = Route.useRouteContext();
  const { limit, offset } = Route.useSearch();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <Trans>Settings</Trans>
        </h1>
      </div>

      <SuspendedOrganizationSettings
        organizationId={organizationId}
        currentMemberRole={currentMemberRole}
        limit={limit}
        offset={offset}
      />
    </div>
  );
}
