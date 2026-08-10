import { useQuery } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { selfListOrganizations } from "@/services/resources/organization";

export interface OrganizationFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OrganizationField({ id, value, onChange, disabled }: OrganizationFieldProps) {
  const { data: organizations, isPending } = useQuery(selfListOrganizations());

  if (isPending) {
    return <Skeleton className="h-7 w-full" />;
  }

  return (
    <Select
      disabled={disabled}
      value={value}
      onValueChange={(next) => next !== null && onChange(next)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue>
          {(val: string) =>
            organizations?.find((organization) => organization.id === val)?.name ?? val
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {organizations?.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
