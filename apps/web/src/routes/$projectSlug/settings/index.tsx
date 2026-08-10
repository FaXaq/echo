import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useLingui, Trans } from "@lingui/react/macro";
import { useState } from "react";
import { authClient } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/ui/sheet";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/ui/alert-dialog";
import { InviteForm } from "./-invite-form";
import { MembersTable } from "./-members-table";
import { OrganizationNameForm } from "./-organization-name-form";
import { isOrganizationAdmin } from "@echo/modules/user/domain";
import { organizationRoleSchema, type OrganizationRole } from "@echo/auth";
import { toast } from "sonner";
import z from "zod";

export const Route = createFileRoute("/$projectSlug/settings/")({
  staticData: { title: "Settings", breadcrumb: "Settings" },
  loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  loader: async ({ deps, context }) => {
    const { organizationId } = context;

    const { data: roleData } = await authClient.organization.getActiveMemberRole({
      query: { organizationId },
    });
    const parsedRole = organizationRoleSchema.safeParse(roleData?.role);
    const currentMemberRole = parsedRole.success ? parsedRole.data : null;

    if (!isOrganizationAdmin(currentMemberRole)) throw redirect({ to: "/" });

    const canDeleteOrganization = authClient.organization.checkRolePermission({
      role: currentMemberRole,
      permissions: { organization: ["delete"] },
    });

    const { data: activeOrganization } = await authClient.organization.getFullOrganization({
      query: { organizationId, membersLimit: 0 },
    });

    if (!activeOrganization)
      return {
        activeOrganization,
        members: [],
        invitations: [],
        currentMemberRole,
        currentUserId: null,
        canDeleteOrganization,
      };

    const { data: invitations } = await authClient.organization.listInvitations({
      query: { organizationId },
    });

    const { data: organizationMembers } = await authClient.organization.listMembers({
      query: {
        organizationId,
        limit: deps.limit,
        offset: deps.offset,
        sortBy: "createdAt",
      },
    });

    const { data: currentSession } = await authClient.getSession();
    const currentUserId = currentSession?.user?.id ?? null;

    return {
      activeOrganization,
      members: organizationMembers?.members ?? [],
      totalMembers: organizationMembers?.total ?? 0,
      invitations: (invitations ?? []).filter((i) => i.status === "pending"),
      currentMemberRole,
      currentUserId,
      canDeleteOrganization,
    };
  },
  validateSearch: z.object({
    limit: z.number().default(25),
    offset: z.number().default(0),
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useLingui();
  const {
    activeOrganization,
    members,
    invitations,
    currentMemberRole,
    currentUserId,
    canDeleteOrganization,
  } = Route.useLoaderData();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = Route.useNavigate();
  const router = useRouter();

  if (!activeOrganization) return null;

  const handleInviteSuccess = () => {
    setIsSheetOpen(false);
    navigate({ search: (prev) => prev });
  };

  const handleDeleteOrganization = async () => {
    setIsDeleting(true);
    try {
      const result = await authClient.organization.delete({
        organizationId: activeOrganization.id,
      });

      if (result.error) {
        logger.error(result.error, "Failed to delete organization");
        toast.error(t`Failed to delete project`);
        return;
      }

      toast.success(t`Project deleted`);
      setIsDeleteDialogOpen(false);
      router.navigate({ to: "/" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t`Settings`}</h1>
        <p className="text-muted-foreground">{t`Manage settings for your project`}</p>
      </div>

      <section className="mb-8 max-w-xl">
        <h2 className="mb-4 text-xl font-semibold">{t`General`}</h2>
        <Card>
          <CardHeader>
            <CardTitle>{t`Project name`}</CardTitle>
            <CardDescription>{t`This is the name displayed across your project.`}</CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationNameForm
              organizationId={activeOrganization.id}
              defaultName={activeOrganization.name}
              onSuccess={() => {
                toast.success(t`Project name updated`);
                router.invalidate();
              }}
            />
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-semibold">{t`Members`}</h2>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger render={<Button />}>{t`Invite a member`}</SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle>{t`Invite a member`}</SheetTitle>
                <SheetDescription>{t`Add a new member to your project`}</SheetDescription>
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
          currentMemberRole={currentMemberRole as OrganizationRole | null}
          currentUserId={currentUserId}
          organizationId={activeOrganization.id}
          onRefresh={() => navigate({ search: (prev) => prev })}
        />
      </section>

      {canDeleteOrganization && (
        <section className="max-w-xl">
          <h2 className="mb-2 text-sm font-medium text-destructive">{t`Danger zone`}</h2>
          <Card>
            <CardHeader>
              <CardTitle>{t`Delete project`}</CardTitle>
              <CardDescription>
                {t`Permanently delete this project and all of its data. This action cannot be undone.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger render={<Button variant="destructive" disabled={isDeleting} />}>
                  <Trans>Delete project</Trans>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <Trans>Delete project</Trans>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <Trans>
                        This will permanently delete <strong>{activeOrganization.name}</strong> and
                        all of its data. This action cannot be undone.
                      </Trans>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      <Trans>Cancel</Trans>
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      isLoading={isDeleting}
                      onClick={handleDeleteOrganization}
                    >
                      <Trans>Delete</Trans>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
