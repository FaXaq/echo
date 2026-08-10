import { createFileRoute, redirect } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";
import { authClient } from "@/lib/auth";
import { isOrganizationAdmin } from "@echo/modules/user/domain";
import { organizationRoleSchema } from "@echo/auth";
import { SuspendedOrganizationSettings } from "@/components/features/organization/suspended-organization-settings";
import z from "zod";

export const Route = createFileRoute("/projects/$projectSlug/settings/")({
  staticData: { title: "Settings", breadcrumb: "Settings" },
  validateSearch: z.object({
    limit: z.number().default(25),
    offset: z.number().default(0),
  }),
  beforeLoad: async ({ context }) => {
    const { organizationId } = context;

    const { data: roleData } = await authClient.organization.getActiveMemberRole({
      query: { organizationId },
    });
    const parsedRole = organizationRoleSchema.safeParse(roleData?.role);
    const currentMemberRole = parsedRole.success ? parsedRole.data : null;

    if (!isOrganizationAdmin(currentMemberRole)) throw redirect({ to: "/" });

    return { currentMemberRole };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useLingui();
  const { organizationId, currentMemberRole } = Route.useRouteContext();
  const { limit, offset } = Route.useSearch();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t`Settings`}</h1>
        <p className="text-muted-foreground">{t`Manage settings for your project`}</p>
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
