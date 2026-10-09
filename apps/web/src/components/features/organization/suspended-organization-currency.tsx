import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getLedgerSettingsQueryOptions } from "@/services/resources/expense";
import { useUpdateOrganizationCurrencyMutation } from "@/services/resources/organization";

function OrganizationCurrencyContent({ organizationId }: { organizationId: string }) {
  const { t } = useLingui();
  const { data: settings } = useSuspenseQuery(getLedgerSettingsQueryOptions({ organizationId }));
  const [currency, setCurrency] = useState(settings.currency);
  const updateCurrency = useUpdateOrganizationCurrencyMutation();

  const save = () =>
    updateCurrency.mutate(
      { organizationId, currency },
      {
        onSuccess: () => toast.add({ type: "success", title: t`Currency updated` }),
        onError: () => toast.add({ type: "error", title: t`Failed to update currency` }),
      },
    );

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-muted-foreground">
        {settings.locked
          ? t`The currency can't be changed once the project has expenses or repayments.`
          : t`All balances and repayments are expressed in this currency.`}
      </p>
      <div className="flex items-center gap-3">
        <Select
          value={currency}
          onValueChange={(next) => setCurrency(next ?? settings.currency)}
          disabled={settings.locked}
        >
          <SelectTrigger aria-label={t`Currency`} className="w-28">
            <SelectValue>{() => currency}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Intl.supportedValuesOf("currency").map((code) => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          disabled={settings.locked || currency === settings.currency}
          isLoading={updateCurrency.isPending}
          onClick={save}
        >
          {t`Save`}
        </Button>
      </div>
    </div>
  );
}

function OrganizationCurrencyError() {
  const { t } = useLingui();
  return <p className="text-sm text-destructive">{t`Something went wrong`}</p>;
}

export function SuspendedOrganizationCurrency({ organizationId }: { organizationId: string }) {
  return (
    <ErrorBoundary FallbackComponent={OrganizationCurrencyError}>
      <Suspense fallback={<Skeleton className="h-20 max-w-xl" />}>
        <OrganizationCurrencyContent organizationId={organizationId} />
      </Suspense>
    </ErrorBoundary>
  );
}
