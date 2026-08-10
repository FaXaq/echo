import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLingui } from "@lingui/react/macro";
import { useInviteMemberMutation } from "@/services/resources/member";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { translateDynamic } from "@/lib/dynamic-messages";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "admin"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteFormProps {
  organizationId: string | undefined;
  onSuccess?: () => void;
}

export function InviteForm({ organizationId, onSuccess }: InviteFormProps) {
  const { t } = useLingui();
  const [serverError, setServerError] = useState<string | undefined>();
  const inviteMemberMutation = useInviteMemberMutation();
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const onSubmit = (values: InviteFormValues) => {
    if (!organizationId) {
      setServerError(t`Project not found`);
      return;
    }

    setServerError(undefined);
    inviteMemberMutation.mutate(
      { email: values.email, role: values.role, organizationId },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
        onError: (error) => {
          setServerError(error.message || t`Failed to invite member`);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          {t`Email`}
        </label>
        <Input
          id="email"
          type="email"
          placeholder={t`Enter email address`}
          {...register("email")}
          disabled={inviteMemberMutation.isPending}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{translateDynamic(t, errors.email.message!)}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium">
          {t`Role`}
        </label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="role" disabled={inviteMemberMutation.isPending}>
                <SelectValue>{() => translateDynamic(t, field.value)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">{translateDynamic(t, "member")}</SelectItem>
                <SelectItem value="admin">{translateDynamic(t, "admin")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.role && (
          <p className="text-sm text-destructive">{translateDynamic(t, errors.role.message!)}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={inviteMemberMutation.isPending} className="w-full">
        {inviteMemberMutation.isPending ? t`Inviting...` : t`Invite`}
      </Button>
    </form>
  );
}
