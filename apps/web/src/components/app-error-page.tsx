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

function generateHumanReadableErrorId() {
  const timePart = Date.now().toString(36).slice(-4);

  const arr = new Uint8Array(4);
  window.crypto.getRandomValues(arr);
  const randomPart = Array.from(arr, (b) => (b % 36).toString(36)).join("");

  return `${timePart}-${randomPart}`.toUpperCase();
}

export function AppErrorPage({ error }: { error: unknown }) {
  const { t } = useLingui();
  const isNetworkError = isTrpcNetworkError(error);
  const humanReadableErrorId = isNetworkError ? generateHumanReadableErrorId() : null;

  useEffect(() => {
    if (!isNetworkError) {
      posthog.captureException(error, { humanReadableErrorId });
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
              <Trans>
                An unexpected error occurred. An error report has been sent to the technical team
                with the code <span className="text-lg">{humanReadableErrorId}</span> attached.
                Reloading the page usually fixes it.
              </Trans>
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
