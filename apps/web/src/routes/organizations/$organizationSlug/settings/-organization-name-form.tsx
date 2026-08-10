import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLingui } from "@lingui/react/macro";
import { authClient } from "@/lib/auth";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { translateDynamic } from "@/lib/dynamic-messages";

const organizationNameSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrganizationNameFormValues>({
    resolver: zodResolver(organizationNameSchema),
    defaultValues: { name: defaultName },
  });

  const onSubmit = async (values: OrganizationNameFormValues) => {
    setServerError(undefined);

    const result = await authClient.organization.update({
      organizationId,
      data: { name: values.name },
    });

    if (result.error) {
      setServerError(result.error.message ?? t`Failed to update organization name`);
      return;
    }

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-3">
      <div className="flex-1 space-y-2">
        <label htmlFor="name" className="sr-only">
          {t`Organization name`}
        </label>
        <Input id="name" {...register("name")} disabled={isSubmitting} />
        {errors.name && (
          <p className="text-sm text-destructive">{translateDynamic(t, errors.name.message!)}</p>
        )}
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? t`Saving...` : t`Save`}
      </Button>
    </form>
  );
}
