import { useEffect, useState } from "react"
import dayjs from "dayjs"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { COLOR_LABELS, EVENT_COLORS, eventDotClasses } from "./colors"
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from "./event-types"
import { OrganizationField } from "./organization-field"
import { PlaceField } from "./place-field"
import { EVENT_TYPES, eventTypeSchema, type CalendarEvent, type CalendarEventRange, type EventColor } from "./types"

const DATETIME_FORMAT = "YYYY-MM-DDTHH:mm"

const placeSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
})

const eventFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    allDay: z.boolean(),
    color: z.enum(EVENT_COLORS as [EventColor, ...EventColor[]]),
    type: eventTypeSchema.nullable(),
    place: placeSchema.nullable(),
    organizationId: z.string().nullable(),
  })
  .refine((data) => dayjs(data.endDate).isAfter(dayjs(data.startDate)), {
    error: "End date must be after start date",
    path: ["endDate"],
  })

type EventFormValues = z.infer<typeof eventFormSchema>

export type EventDialogState =
  | { mode: "create"; range: CalendarEventRange }
  | { mode: "edit"; event: CalendarEvent }
  | null

function stateToDefaultValues(
  state: EventDialogState,
  defaultOrganizationId: string | null = null
): EventFormValues {
  if (state?.mode === "edit") {
    const { event } = state
    return {
      title: event.title,
      description: event.description ?? "",
      startDate: dayjs(event.startDate).format(DATETIME_FORMAT),
      endDate: dayjs(event.endDate).format(DATETIME_FORMAT),
      allDay: !!event.allDay,
      color: event.color,
      type: event.type,
      organizationId: event.organizationId,
      place: event.place,
    }
  }

  const start = state?.mode === "create" ? dayjs(state.range.start) : dayjs()
  const allDay = state?.mode === "create" ? !!state.range.allDay : false

  return {
    title: "",
    description: "",
    startDate: start.format(DATETIME_FORMAT),
    endDate: start.add(1, "hour").format(DATETIME_FORMAT),
    allDay,
    color: "blue",
    type: null,
    organizationId: defaultOrganizationId,
    place: null,
  }
}

interface EventDialogProps {
  state: EventDialogState
  defaultOrganizationId?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (event: CalendarEvent) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}

export function EventDialog({
  state,
  defaultOrganizationId = null,
  onOpenChange,
  onSubmit,
  onDelete,
}: EventDialogProps) {
  const { t } = useTranslation("calendar")

  // Keep rendering the last non-null state while the dialog plays its close
  // animation, so the content doesn't flicker/reset before it's done fading out.
  const [content, setContent] = useState(state)
  useEffect(() => {
    if (state !== null) setContent(state)
  }, [state])

  const isEdit = content?.mode === "edit"

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: stateToDefaultValues(content, defaultOrganizationId),
  })

  const [isDeleting, setIsDeleting] = useState(false)

  const allDay = watch("allDay");

  useEffect(() => {
    if (state !== null) reset(stateToDefaultValues(state, defaultOrganizationId))
  }, [state, defaultOrganizationId, reset])


  const submit = async (values: EventFormValues) => {
    const start = values.allDay
      ? dayjs(values.startDate).startOf("day")
      : dayjs(values.startDate)
    const end = values.allDay
      ? dayjs(values.endDate).endOf("day")
      : dayjs(values.endDate)

    await onSubmit({
      id: isEdit ? content.event.id : crypto.randomUUID(),
      title: values.title,
      description: values.description || undefined,
      startDate: start.toDate(),
      endDate: end.toDate(),
      allDay: values.allDay,
      color: values.color,
      type: values.type,
      organizationId: values.organizationId,
      place: values.place,
    })
  }

  const handleDelete = async (e: React.MouseEvent) => {
    if (!isEdit) return
    e.preventDefault()
    setIsDeleting(true)
    try {
      await onDelete(content.event.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("Edit event") : t("New event")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t("Edit event") : t("New event")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="event-title">{t("Title")}</FieldLabel>
              <Input id="event-title" {...register("title")} />
              <FieldError>
                {errors.title && t(errors.title.message!)}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="event-description">
                {t("Description")}
              </FieldLabel>
              <Textarea id="event-description" {...register("description")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="event-place">{t("Place")}</FieldLabel>
              <Controller
                name="place"
                control={control}
                render={({ field }) => (
                  <PlaceField
                    id="event-place"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="event-organization">
                {t("Organization")}
              </FieldLabel>
              <Controller
                name="organizationId"
                control={control}
                render={({ field }) => (
                  <OrganizationField
                    disabled={isEdit}
                    id="event-organization"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor="event-start">{t("Start")}</FieldLabel>
              <Input
                disabled={allDay}
                id="event-start"
                type="datetime-local"
                {...register("startDate")}
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor="event-end">{t("End")}</FieldLabel>
              <Input
                disabled={allDay}
                id="event-end"
                type="datetime-local"
                {...register("endDate")}
              />
            </Field>
            <FieldError>{errors.endDate && t(errors.endDate.message!)}</FieldError>

            <Field orientation="horizontal">
              <FieldLabel htmlFor="event-all-day" className="gap-2">
                <input
                  id="event-all-day"
                  type="checkbox"
                  className="size-3.5"
                  {...register("allDay")}
                />
                {t("All day")}
              </FieldLabel>
            </Field>

            <Field>
              <FieldLabel htmlFor="event-color">{t("Color")}</FieldLabel>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="event-color" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          <span
                            className={cn(
                              "mr-1.5 inline-block size-2 rounded-full",
                              eventDotClasses[color]
                            )}
                          />
                          {t(COLOR_LABELS[color])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="event-type">{t("Type")}</FieldLabel>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(next) =>
                      field.onChange(next === "none" ? null : eventTypeSchema.parse(next))
                    }
                  >
                    <SelectTrigger id="event-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("None")}</SelectItem>
                      {EVENT_TYPES.map((type) => {
                        const Icon = EVENT_TYPE_ICONS[type]
                        return (
                          <SelectItem key={type} value={type}>
                            <Icon className="mr-1.5 inline-block size-3.5" />
                            {t(EVENT_TYPE_LABELS[type])}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="items-center sm:justify-between">
            {isEdit ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {t("Delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("Delete event?")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(
                        "This will permanently delete this event. This action cannot be undone."
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      {t("Cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      isLoading={isDeleting}
                      onClick={handleDelete}
                    >
                      {t("Delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  {t("Cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" isLoading={isSubmitting}>
                {isEdit ? t("Save changes") : t("Save")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
