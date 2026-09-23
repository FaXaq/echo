import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLingui } from "@lingui/react/macro";

import { translateDynamic } from "@/lib/dynamic-messages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PlaceField } from "@/components/ui/event-calendar/place-field";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { listMembersQueryOptions } from "@/services/resources/member";
import {
  listOutreachCardContactsQueryOptions,
  useCreateOutreachCardMutation,
  useDeleteOutreachCardMutation,
  useLinkOutreachContactToCardMutation,
  useUnlinkOutreachContactFromCardMutation,
  useUpdateOutreachCardMutation,
  type OutreachCard,
} from "@/services/resources/outreach";
import { OutreachContactField, type OutreachContactValue } from "./outreach-contact-field";

const placeSchema = z
  .object({
    name: z.string().min(1),
    address: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
  })
  .nullable();

const cardFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  place: placeSchema,
  description: z.string(),
  assigneeId: z.string().nullable(),
  contacts: z.array(z.object({ id: z.string(), name: z.string() })),
});

type CardFormValues = z.infer<typeof cardFormSchema>;

export type OutreachCardDialogState =
  | { mode: "create"; columnId: string }
  | { mode: "edit"; card: OutreachCard }
  | null;

function stateToDefaultValues(state: OutreachCardDialogState): CardFormValues {
  if (state?.mode === "edit") {
    const { card } = state;
    return {
      title: card.title,
      place: card.place,
      description: card.description ?? "",
      assigneeId: card.assigneeId,
      contacts: [],
    };
  }
  return { title: "", place: null, description: "", assigneeId: null, contacts: [] };
}

export interface OutreachCardDialogProps {
  organizationId: string;
  state: OutreachCardDialogState;
  onOpenChange: (open: boolean) => void;
}

export function OutreachCardDialog({
  organizationId,
  state,
  onOpenChange,
}: OutreachCardDialogProps) {
  const { t } = useLingui();

  const [content, setContent] = useState(state);
  useEffect(() => {
    if (state !== null) setContent(state);
  }, [state]);

  const isEdit = content?.mode === "edit";
  const isStateEdit = state?.mode === "edit";

  const { data: members } = useQuery(
    listMembersQueryOptions({ organizationId, isPersonal: false, limit: 100, offset: 0 }),
  );
  const { data: existingContacts } = useQuery({
    ...listOutreachCardContactsQueryOptions({
      organizationId,
      cardId: isStateEdit ? state.card.id : "",
    }),
    enabled: isStateEdit,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: stateToDefaultValues(content),
  });

  useEffect(() => {
    if (state !== null) reset(stateToDefaultValues(state));
  }, [state, reset]);

  useEffect(() => {
    if (isStateEdit && existingContacts) {
      setValue(
        "contacts",
        existingContacts.map((contact) => ({ id: contact.id, name: contact.name })),
      );
    }
  }, [state, isStateEdit, existingContacts, setValue]);

  const [isDeleting, setIsDeleting] = useState(false);

  const createCardMutation = useCreateOutreachCardMutation();
  const updateCardMutation = useUpdateOutreachCardMutation();
  const deleteCardMutation = useDeleteOutreachCardMutation();
  const linkContactMutation = useLinkOutreachContactToCardMutation();
  const unlinkContactMutation = useUnlinkOutreachContactFromCardMutation();

  const syncContacts = async (cardId: string, nextContacts: OutreachContactValue[]) => {
    const originalIds = new Set((existingContacts ?? []).map((contact) => contact.id));
    const nextIds = new Set(nextContacts.map((contact) => contact.id));
    const toLink = nextContacts.filter((contact) => !originalIds.has(contact.id));
    const toUnlink = (existingContacts ?? []).filter((contact) => !nextIds.has(contact.id));

    await Promise.all([
      ...toLink.map((contact) =>
        linkContactMutation.mutateAsync({ organizationId, cardId, contactId: contact.id }),
      ),
      ...toUnlink.map((contact) =>
        unlinkContactMutation.mutateAsync({ organizationId, cardId, contactId: contact.id }),
      ),
    ]);
  };

  const submit = async (values: CardFormValues) => {
    if (!content) return;
    try {
      if (isEdit) {
        await updateCardMutation.mutateAsync({
          organizationId,
          id: content.card.id,
          title: values.title,
          place: values.place,
          description: values.description,
          assigneeId: values.assigneeId,
        });
        await syncContacts(content.card.id, values.contacts);
      } else {
        const card = await createCardMutation.mutateAsync({
          organizationId,
          columnId: content.columnId,
          title: values.title,
          place: values.place,
          description: values.description,
          assigneeId: values.assigneeId,
        });
        await syncContacts(card.id, values.contacts);
      }
      onOpenChange(false);
    } catch {
      toast.add({ title: t`Couldn't save card`, type: "error" });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    if (!isEdit) return;
    e.preventDefault();
    setIsDeleting(true);
    try {
      await deleteCardMutation.mutateAsync({ organizationId, id: content.card.id });
      onOpenChange(false);
    } catch {
      toast.add({ title: t`Couldn't delete card`, type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t`Edit card` : t`New card`}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t`Edit card` : t`New card`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="grid min-h-0 flex-1 grid-rows-[1fr_auto]">
          <ScrollArea className="-mx-4 min-h-0 px-4">
            <FieldGroup className="pb-4">
              <Field>
                <FieldLabel htmlFor="card-title">{t`Title`}</FieldLabel>
                <Input
                  id="card-title"
                  placeholder={t`e.g. Book a residency`}
                  {...register("title")}
                />
                <FieldError>
                  {errors.title && translateDynamic(t, errors.title.message!)}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="card-place">{t`Lieu`}</FieldLabel>
                <Controller
                  name="place"
                  control={control}
                  render={({ field }) => (
                    <PlaceField id="card-place" value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="card-assignee">{t`Assignee`}</FieldLabel>
                <Controller
                  name="assigneeId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "unassigned"}
                      onValueChange={(next) => field.onChange(next === "unassigned" ? null : next)}
                    >
                      <SelectTrigger id="card-assignee" className="w-full">
                        <SelectValue>
                          {() =>
                            field.value
                              ? (members?.members.find((member) => member.userId === field.value)
                                  ?.user.name ?? field.value)
                              : t`Unassigned`
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">{t`Unassigned`}</SelectItem>
                        {(members?.members ?? []).map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="card-contacts">{t`Contacts`}</FieldLabel>
                <Controller
                  name="contacts"
                  control={control}
                  render={({ field }) => (
                    <OutreachContactField
                      id="card-contacts"
                      organizationId={organizationId}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
            </FieldGroup>
          </ScrollArea>

          <DialogFooter className="items-center sm:justify-between">
            {isEdit ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button type="button" variant="destructive" size="sm" disabled={isSubmitting} />
                  }
                >
                  {t`Delete`}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t`Delete card?`}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t`This will permanently delete this card. This action cannot be undone.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>{t`Cancel`}</AlertDialogCancel>
                    <AlertDialogAction isLoading={isDeleting} onClick={handleDelete}>
                      {t`Delete`}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <DialogClose
                render={<Button type="button" variant="outline" disabled={isSubmitting} />}
              >
                {t`Cancel`}
              </DialogClose>
              <Button type="submit" isLoading={isSubmitting}>
                {isEdit ? t`Save changes` : t`Save`}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
