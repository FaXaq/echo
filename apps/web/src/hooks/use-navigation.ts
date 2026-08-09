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

const PERSONAL_ID = null;

type OrganizationOption = Omit<
  NonNullable<ReturnType<Awaited<typeof authClient.useListOrganizations>>["data"]>[number],
  "id"
> & { id: string | null };

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

  const orgOptions: OrganizationOption[] = [
    { id: PERSONAL_ID, name: t`Personal`, createdAt: new Date(), slug: "" },
    ...(organizations ?? []),
  ];

  const setActiveOrganization = (org: OrganizationOption) => {
    if (org.id === null) {
      navigate({ to: "/" });
    } else {
      navigate({ to: "/organizations/$organizationSlug", params: { organizationSlug: org.slug } });
    }
  };

  const slug = activeOrganization?.slug ?? "";
  const personalNavGroups: NavGroup[] = [
    {
      title: t`Personal`,
      items: [
        { title: t`Calendar`, to: "/calendar" },
        { title: t`Practice`, to: "/" },
        { title: t`Backlog`, to: "/" },
      ],
    },
  ];

  const projectNavGroups: NavGroup[] = [
    {
      title: activeOrganization?.name ?? "",
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
  ];

  const navGroups: NavGroup[] =
    activeOrganization === null || activeOrganization === undefined
      ? personalNavGroups
      : projectNavGroups;

  return { orgOptions, activeOrganization, setActiveOrganization, navGroups };
}
