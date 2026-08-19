import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui, Trans } from "@lingui/react/macro";
import { useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth";
import { isOrganizationAdmin } from "@echo/modules/user/domain";
import type { OrganizationRole } from "@echo/auth";
import { toast } from "@/components/ui/toast";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
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
import {
  getFullOrganizationQueryOptions,
  useDeleteOrganizationMutation,
} from "@/services/resources/organization";
import { listMembersQueryOptions, listInvitationsQueryOptions } from "@/services/resources/member";
import { useSession } from "@/hooks/use-session";
import { InviteForm } from "@/routes/projects/$projectSlug/settings/-invite-form";
import { MembersTable } from "@/routes/projects/$projectSlug/settings/-members-table";
import { OrganizationNameForm } from "@/routes/projects/$projectSlug/settings/-organization-name-form";
import { SuspendedPlanUsage } from "@/components/features/organization/suspended-plan-usage";

export interface SuspendedOrganizationSettingsProps {
  organizationId: string;
  currentMemberRole: OrganizationRole | null;
  limit: number;
  offset: number;
}

function OrganizationSettingsContent({
  organizationId,
  currentMemberRole,
  limit,
  offset,
}: SuspendedOrganizationSettingsProps) {
  const { t } = useLingui();
  const router = useRouter();
  const { session } = useSession();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: organization } = useSuspenseQuery(
    getFullOrganizationQueryOptions({ organizationId }),
  );
  const { data: members } = useSuspenseQuery(
    listMembersQueryOptions({
      organizationId,
      limit,
      offset,
      isPersonal: organization.isPersonal === true,
    }),
  );
  const { data: invitations } = useSuspenseQuery(listInvitationsQueryOptions({ organizationId }));

  const deleteOrganizationMutation = useDeleteOrganizationMutation();

  if (!organization || !isOrganizationAdmin(currentMemberRole)) return null;

  const canDeleteOrganization = authClient.organization.checkRolePermission({
    role: currentMemberRole,
    permissions: { organization: ["delete"] },
  });

  const handleDeleteOrganization = () => {
    deleteOrganizationMutation.mutate(
      { organizationId },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: t`Project deleted` });
          setIsDeleteDialogOpen(false);
          router.navigate({ to: "/" });
        },
        onError: () => {
          toast.add({ type: "error", title: t`Failed to delete project` });
        },
      },
    );
  };

  return (
    <>
      {organization.isPersonal && (
        <section className="mb-8 max-w-xl">
          <p>
            <Trans>It's your personal space.</Trans>
          </p>
        </section>
      )}
      <section className="mb-8 max-w-xl">
        <h2 className="mb-4 text-xl font-semibold">{t`General`}</h2>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t`Project name`}</CardTitle>
              <CardDescription>{t`This is the name displayed across your project.`}</CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationNameForm
                organizationId={organization.id}
                defaultName={organization.name}
                onSuccess={() => toast.add({ type: "success", title: t`Project name updated` })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Project slug</Trans>
              </CardTitle>
              <CardDescription>
                <Trans>This is the slug that appears in the URL. It's auto-generated.</Trans>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code>{organization.slug}</code>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-8 max-w-xl">
        <h2 className="mb-4 text-xl font-semibold">{t`Plan`}</h2>
        <SuspendedPlanUsage
          organizationId={organization.id}
          isPersonal={organization.isPersonal === true}
        />
      </section>

      {!organization.isPersonal && (
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
                    organizationId={organization.id}
                    onSuccess={() => setIsSheetOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <MembersTable
            members={members?.members ?? []}
            invitations={invitations}
            currentMemberRole={currentMemberRole}
            currentUserId={session.user.id}
            organizationId={organization.id}
          />
        </section>
      )}

      <Card className="ring-destructive/30 max-w-xl">
        <CardHeader>
          <CardTitle className="text-destructive">
            <Trans>Danger zone</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Every action here is destructive. Please proceed with caution.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canDeleteOrganization && !organization.isPersonal && (
            <Card>
              <CardHeader>
                <CardTitle>{t`Delete project`}</CardTitle>
                <CardDescription>
                  {t`Permanently delete this project and all of its data. This action cannot be undone.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="destructive"
                        disabled={deleteOrganizationMutation.isPending}
                      />
                    }
                  >
                    <Trans>Delete project</Trans>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        <Trans>Delete project</Trans>
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        <Trans>
                          This will permanently delete <strong>{organization.name}</strong> and all
                          of its data. This action cannot be undone.
                        </Trans>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleteOrganizationMutation.isPending}>
                        <Trans>Cancel</Trans>
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        isLoading={deleteOrganizationMutation.isPending}
                        onClick={handleDeleteOrganization}
                      >
                        <Trans>Delete</Trans>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function OrganizationSettingsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-40 max-w-xl" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function OrganizationSettingsError() {
  const { t } = useLingui();
  return <p className="text-sm text-destructive">{t`Something went wrong`}</p>;
}

export function SuspendedOrganizationSettings(props: SuspendedOrganizationSettingsProps) {
  return (
    <ErrorBoundary FallbackComponent={OrganizationSettingsError}>
      <Suspense fallback={<OrganizationSettingsSkeleton />}>
        <OrganizationSettingsContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
