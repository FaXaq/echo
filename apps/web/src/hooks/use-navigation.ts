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
  const currentSlug = (params as Record<string, string | undefined>).projectSlug;
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
              title: t`Setlist`,
              to: "/projects/$projectSlug",
              params: { projectSlug: slug },
            },
            {
              title: t`Drive`,
              to: "/projects/$projectSlug",
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
