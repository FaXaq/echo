import { authClient } from "@/lib/auth"
import type { FileRouteTypes } from "@/routeTree.gen"
import { useNavigate, useParams } from "@tanstack/react-router"

type NavItem = {
  title: string
  to: FileRouteTypes["to"]
  params?: Record<string, string>
  isActive?: boolean
}

export type NavGroup = { title: string; items: NavItem[] }

const PERSONAL_ID = null

const personalNavGroups: NavGroup[] = [
  {
    title: "Personal",
    items: [
      { title: "Planning", to: "/" },
      { title: "Practice", to: "/" },
      { title: "Backlog", to: "/" },
    ],
  },
]

type OrganizationOption = Omit<NonNullable<ReturnType<Awaited<typeof authClient.useListOrganizations>>["data"]>[number], "id"> & { id: string | null };

export function useNavigation() {
  const { data: organizations } = authClient.useListOrganizations()
  const navigate = useNavigate();

  const params = useParams({ strict: false })
  const currentSlug = (params as Record<string, string | undefined>).organizationSlug
  const activeOrganization = currentSlug
    ? (organizations ?? []).find((o) => o.slug === currentSlug) ?? null
    : null

  const orgOptions: OrganizationOption[] = [
    { id: PERSONAL_ID, name: "Personal", createdAt: new Date(), slug: "" },
    ...(organizations ?? []),
  ]

  const setActiveOrganization = (org: OrganizationOption) => {
    if (org.id === null) {
      navigate({ to: "/" })
    } else {
      navigate({ to: "/organizations/$organizationSlug", params: { "organizationSlug": org.slug } })
    }
  }

  const slug = activeOrganization?.slug ?? ""
  const projectNavGroups: NavGroup[] = [
    {
      title: activeOrganization?.name ?? "",
      items: [
        { title: "Planning", to: "/organizations/$organizationSlug", params: { "organizationSlug": slug } },
        { title: "Songs", to: "/organizations/$organizationSlug/songs", params: { "organizationSlug": slug } },
        { title: "Setlist", to: "/organizations/$organizationSlug", params: { "organizationSlug": slug } },
        { title: "Drive", to: "/organizations/$organizationSlug", params: { "organizationSlug": slug } },
        { title: "Members", to: "/organizations/$organizationSlug/members", params: { "organizationSlug": slug } },
      ],
    },
  ]

  const navGroups: NavGroup[] = activeOrganization === null || activeOrganization === undefined
    ? personalNavGroups
    : projectNavGroups

  return { orgOptions, activeOrganization, setActiveOrganization, navGroups }
}
