import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLingui } from "@lingui/react/macro";
import { useUpdateOrganizationMutation } from "@/services/resources/organization";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { translateDynamic } from "@/lib/dynamic-messages";

const organizationNameSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

type OrganizationNameFormValues = z.infer<typeof organizationNameSchema>;

interface OrganizationNameFormProps {
  organizationId: string;
  defaultName: string;
  onSuccess?: () => void;
}

export function OrganizationNameForm({
  organizationId,
  defaultName,
  onSuccess,
}: OrganizationNameFormProps) {
  const { t } = useLingui();
  const [serverError, setServerError] = useState<string | undefined>();
  const updateOrganizationMutation = useUpdateOrganizationMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<OrganizationNameFormValues>({
    resolver: zodResolver(organizationNameSchema),
    defaultValues: { name: defaultName },
  });

  const onSubmit = (values: OrganizationNameFormValues) => {
    setServerError(undefined);

    updateOrganizationMutation.mutate(
      { organizationId, name: values.name },
      {
        onSuccess: () => onSuccess?.(),
        onError: (error) => {
          setServerError(error.message || t`Failed to update project name`);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-3">
      <div className="flex-1 space-y-2">
        <label htmlFor="name" className="sr-only">
          {t`Project name`}
        </label>
        <Input id="name" {...register("name")} disabled={updateOrganizationMutation.isPending} />
        {errors.name && (
          <p className="text-sm text-destructive">{translateDynamic(t, errors.name.message!)}</p>
        )}
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      </div>
      <Button type="submit" disabled={updateOrganizationMutation.isPending || !isDirty}>
        {updateOrganizationMutation.isPending ? t`Saving...` : t`Save`}
      </Button>
    </form>
  );
}
