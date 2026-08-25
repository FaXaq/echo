import type { FileRouteTypes } from "@/routeTree.gen";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { organizationRoleSchema } from "@echo/auth";
import { isOrganizationAdmin } from "@echo/modules/user/domain";
import { selfListOrganizations, type Organizations } from "@/services/resources/organization";
import { getActiveMemberRoleQueryOptions } from "@/services/resources/session";

type NavItem = {
  title: string;
  to: FileRouteTypes["to"];
  params?: Record<string, string>;
  isActive?: boolean;
};

export type NavGroup = { title: string; items: NavItem[] };

type OrganizationOption = Organizations[number];

export function useNavigation() {
  const { t } = useLingui();
  const { data: organizations } = useQuery(selfListOrganizations());
  const navigate = useNavigate();

  const params = useParams({ strict: false });
  const currentSlug = (params as Record<string, string | undefined>).projectSlug;
  const activeOrganization = currentSlug
    ? ((organizations ?? []).find((o) => o.slug === currentSlug) ?? null)
    : null;

  const { data: activeMemberRole } = useQuery({
    ...getActiveMemberRoleQueryOptions({ organizationId: activeOrganization?.id ?? "" }),
    enabled: activeOrganization !== null,
  });

  const parsedActiveMemberRole = organizationRoleSchema.safeParse(activeMemberRole?.role);
  const currentMemberRole = parsedActiveMemberRole.success ? parsedActiveMemberRole.data : null;

  const isActiveOrganizationAdmin =
    activeOrganization !== null && isOrganizationAdmin(currentMemberRole);

  const orgOptions: OrganizationOption[] = [...(organizations ?? [])].sort(
    (a, b) => Number(b.isPersonal) - Number(a.isPersonal),
  );

  const setActiveOrganization = (org: OrganizationOption) => {
    navigate({ to: "/projects/$projectSlug", params: { projectSlug: org.slug } });
  };

  const slug = activeOrganization?.slug ?? "";
  const navGroups: NavGroup[] = activeOrganization
    ? [
        {
          title: activeOrganization.name,
          items: [
            {
              title: t`Calendar`,
              to: "/projects/$projectSlug/calendar",
              params: { projectSlug: slug },
            },
            {
              title: t`Songs`,
              to: "/projects/$projectSlug/songs",
              params: { projectSlug: slug },
            },
            {
              title: t`Drive`,
              to: "/projects/$projectSlug/drive",
              params: { projectSlug: slug },
            },
            ...(isActiveOrganizationAdmin
              ? [
                  {
                    title: t`Settings`,
                    to: "/projects/$projectSlug/settings" as const,
                    params: { projectSlug: slug },
                  },
                ]
              : []),
          ],
        },
      ]
    : [];

  return { orgOptions, activeOrganization, setActiveOrganization, navGroups };
}
