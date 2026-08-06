import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import { authClient } from "@/lib/auth"
import { Button } from "@/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/ui/sheet"
import { InviteForm } from "./-invite-form"
import { MembersTable } from "./-members-table"
import type { OrganizationRole } from "@echo/auth"
import z from "zod"

export const Route = createFileRoute("/organizations/$organizationSlug/members/")({
  staticData: { breadcrumb: "Members" },
  loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  loader: async ({ deps, context }) => {
    const { organizationId } = context;

    const { data: activeOrganization } = await authClient.organization.getFullOrganization({
      query: { organizationId, membersLimit: 0 }
    });

    if (!activeOrganization) return { activeOrganization, members: [], currentMemberRole: null, currentUserId: null }

    const { data: invitations } = await authClient.organization.listInvitations({
      query: { organizationId }
    })

    const { data: organizationMembers } = await authClient.organization.listMembers({
      query: {
        organizationId,
        limit: deps.limit,
        offset: deps.offset,
        sortBy: "createdAt",
      }
    })

    const { data: currentSession } = await authClient.getSession();
    const currentUserId = currentSession?.user?.id ?? null;
    const currentMember = organizationMembers?.members?.find(m => m.userId === currentUserId);
    const currentMemberRole = (currentMember?.role ?? null) as OrganizationRole | null;

    return {
      activeOrganization,
      members: organizationMembers?.members ?? [],
      totalMembers: organizationMembers?.total ?? 0,
      invitations: (invitations ?? []).filter(i => i.status === "pending"),
      currentMemberRole,
      currentUserId,
    };
  },
  validateSearch: z.object({
    limit: z.number().default(25),
    offset: z.number().default(0)
  }),
  component: MembersPage,
})

function MembersPage() {
  const { t } = useTranslation("members")
  const { activeOrganization, members, invitations, currentMemberRole, currentUserId } = Route.useLoaderData();
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const navigate = Route.useNavigate()

  if (!activeOrganization) return;

  const handleInviteSuccess = () => {
    setIsSheetOpen(false)
    navigate({ search: (prev) => prev })
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("Members")}</h1>
          <p className="text-muted-foreground">
            {t("Manage members and invitations for your project")}
          </p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger render={<Button />}>
            {t("Invite a member")}
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>{t("Invite a member")}</SheetTitle>
              <SheetDescription>
                {t("Add a new member to your organization")}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-auto px-6">
              <InviteForm
                organizationId={activeOrganization.id}
                onSuccess={handleInviteSuccess}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <MembersTable
        members={members}
        invitations={invitations}
        currentMemberRole={currentMemberRole}
        currentUserId={currentUserId}
        organizationId={activeOrganization.id}
        onRefresh={() => navigate({ search: (prev) => prev })}
      />
    </div>
  )
}
