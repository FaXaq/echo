import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { selfListOrganizations } from "@/services/resources/organization";

const NONE_VALUE = "none";

export interface OrganizationFieldProps {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function OrganizationField({ id, value, onChange, disabled }: OrganizationFieldProps) {
  const { t } = useTranslation("calendar");
  const { data: organizations, isPending } = useQuery(selfListOrganizations());

  if (isPending) {
    return <Skeleton className="h-7 w-full" />;
  }

  return (
    <Select
      disabled={disabled}
      value={value ?? NONE_VALUE}
      onValueChange={(next) => onChange(next === NONE_VALUE ? null : next)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue>
          {(val: string) =>
            val === NONE_VALUE
              ? t("No organization")
              : (organizations?.find((organization) => organization.id === val)?.name ?? val)
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>{t("No organization")}</SelectItem>
        {organizations?.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
