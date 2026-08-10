import { authClient } from "@/lib/auth";
import type { FileRouteTypes } from "@/routeTree.gen";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";
import { organizationRoleSchema } from "@echo/auth";
import { isOrganizationAdmin } from "@echo/modules/user/domain";

type NavItem = {
  title: string;
  to: FileRouteTypes["to"];
  params?: Record<string, string>;
  isActive?: boolean;
};

export type NavGroup = { title: string; items: NavItem[] };

type OrganizationOption = NonNullable<
  ReturnType<Awaited<typeof authClient.useListOrganizations>>["data"]
>[number];

export function useNavigation() {
  const { t } = useLingui();
  const { data: organizations } = authClient.useListOrganizations();
  const { data: activeMemberRole } = authClient.useActiveMemberRole();
  const navigate = useNavigate();

  const params = useParams({ strict: false });
  const currentSlug = (params as Record<string, string | undefined>).organizationSlug;
  const activeOrganization = currentSlug
    ? ((organizations ?? []).find((o) => o.slug === currentSlug) ?? null)
    : null;

  const parsedActiveMemberRole = organizationRoleSchema.safeParse(activeMemberRole?.role);
  const currentMemberRole = parsedActiveMemberRole.success ? parsedActiveMemberRole.data : null;

  const isActiveOrganizationAdmin =
    activeOrganization !== null && isOrganizationAdmin(currentMemberRole);

  const orgOptions: OrganizationOption[] = [...(organizations ?? [])].sort(
    (a, b) => Number(b.isPersonal) - Number(a.isPersonal),
  );

  const setActiveOrganization = (org: OrganizationOption) => {
    navigate({ to: "/organizations/$organizationSlug", params: { organizationSlug: org.slug } });
  };

  const slug = activeOrganization?.slug ?? "";
  const navGroups: NavGroup[] = activeOrganization
    ? [
        {
          title: activeOrganization.name,
          items: [
            {
              title: t`Calendar`,
              to: "/organizations/$organizationSlug/calendar",
              params: { organizationSlug: slug },
            },
            {
              title: t`Setlist`,
              to: "/organizations/$organizationSlug",
              params: { organizationSlug: slug },
            },
            {
              title: t`Drive`,
              to: "/organizations/$organizationSlug",
              params: { organizationSlug: slug },
            },
            ...(isActiveOrganizationAdmin
              ? [
                  {
                    title: t`Settings`,
                    to: "/organizations/$organizationSlug/settings" as const,
                    params: { organizationSlug: slug },
                  },
                ]
              : []),
          ],
        },
      ]
    : [];

  return { orgOptions, activeOrganization, setActiveOrganization, navGroups };
}
