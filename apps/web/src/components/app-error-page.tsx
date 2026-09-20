import { useEffect } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { TriangleAlert, WifiOff } from "lucide-react";
import posthog from "posthog-js";
import { isTrpcNetworkError } from "@/lib/trpc-user-facing-error";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function AppErrorPage({ error }: { error: unknown }) {
  const { t } = useLingui();
  const isNetworkError = isTrpcNetworkError(error);

  useEffect(() => {
    if (!isNetworkError) {
      posthog.captureException(error);
    }
  }, [error, isNetworkError]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">{isNetworkError ? <WifiOff /> : <TriangleAlert />}</EmptyMedia>
          <EmptyTitle>{isNetworkError ? t`No connection` : t`Something went wrong`}</EmptyTitle>
          <EmptyDescription>
            {isNetworkError ? (
              <Trans>We can't reach the server. Check your connection and try again.</Trans>
            ) : (
              <Trans>An unexpected error occurred. Reloading the page usually fixes it.</Trans>
            )}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => window.location.reload()}>
            <Trans>Reload</Trans>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
