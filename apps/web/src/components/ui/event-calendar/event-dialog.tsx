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
import type { CalendarEvent, CalendarEventRange, EventColor } from "./types"

const DATETIME_FORMAT = "YYYY-MM-DDTHH:mm"

const eventFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    allDay: z.boolean(),
    color: z.enum(EVENT_COLORS as [EventColor, ...EventColor[]]),
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

function stateToDefaultValues(state: EventDialogState): EventFormValues {
  if (state?.mode === "edit") {
    const { event } = state
    return {
      title: event.title,
      description: event.description ?? "",
      startDate: dayjs(event.startDate).format(DATETIME_FORMAT),
      endDate: dayjs(event.endDate).format(DATETIME_FORMAT),
      allDay: !!event.allDay,
      color: event.color,
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
  }
}

interface EventDialogProps {
  state: EventDialogState
  onOpenChange: (open: boolean) => void
  onSubmit: (event: CalendarEvent) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}

export function EventDialog({
  state,
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
    defaultValues: stateToDefaultValues(content),
  })

  const [isDeleting, setIsDeleting] = useState(false)

  const allDay = watch("allDay");

  useEffect(() => {
    if (state !== null) reset(stateToDefaultValues(state))
  }, [state, reset])


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
