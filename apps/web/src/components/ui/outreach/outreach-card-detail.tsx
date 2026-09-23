import { useState } from "react";
import { Kanban, Mail, MapPin, Megaphone, MoreVertical, Phone, Share2, User } from "lucide-react";
import { useLingui } from "@lingui/react/macro";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityDetailLayout, type SidebarItem } from "@/components/ui/entity-detail-layout";
import { MarkdownEditor, type MarkdownSaveStatus } from "@/components/ui/markdown-editor";
import { Blobatar } from "@/ui/blobatar";
import type { OutreachCard, OutreachCardContact } from "@/services/resources/outreach";

export interface OutreachCardDetailProps {
  card: OutreachCard;
  columnName: string;
  contacts: OutreachCardContact[];
  description: string;
  onDescriptionChange: (markdown: string) => void;
  descriptionSaveStatus?: MarkdownSaveStatus;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export function OutreachCardDetail({
  card,
  columnName,
  contacts,
  description,
  onDescriptionChange,
  descriptionSaveStatus,
  onShare,
  onEdit,
  onDelete,
  className,
}: OutreachCardDetailProps) {
  const { t } = useLingui();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
    {
      label: t`Assignee`,
      value: card.assigneeName ? (
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <span className="truncate text-[13px] font-medium">{card.assigneeName}</span>
          <Blobatar
            name={card.assigneeName}
            blobatar={{ animate: "always", traits: { shape: 0.11 } }}
          />
        </div>
      ) : (
        <span className="text-[13px] font-medium">{t`Unassigned`}</span>
      ),
      badge: card.assigneeName ? (
        <>
          <User data-icon="inline-start" />
          {card.assigneeName}
        </>
      ) : undefined,
    },
    {
      label: t`Column`,
      value: (
        <Badge variant="secondary">
          <Kanban className="size-3.5" data-icon="inline-start" />
          {columnName}
        </Badge>
      ),
      badge: (
        <>
          <Kanban data-icon="inline-start" />
          {columnName}
        </>
      ),
    },
    {
      label: t`Lieu`,
      value: card.place ? (
        <>
          <div className="text-[13px] font-medium">{card.place.name}</div>
          <div className="text-xs text-muted-foreground">{card.place.address}</div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${card.place.lat},${card.place.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs"
          >
            {t`Open in Maps`}
          </a>
        </>
      ) : (
        <div className="text-[13px] font-medium">—</div>
      ),
      badge: card.place ? (
        <>
          <MapPin data-icon="inline-start" />
          {card.place.name}
        </>
      ) : undefined,
    },
    {
      label: t`Contacts`,
      value:
        contacts.length === 0 ? (
          <div className="text-[13px] font-medium">—</div>
        ) : (
          <div className="flex flex-col gap-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="text-right">
                <div className="text-[13px] font-medium">{contact.name}</div>
                {contact.phone && (
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <span className="truncate">{contact.phone}</span>
                    <Phone className="size-3 shrink-0" />
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <span className="truncate">{contact.email}</span>
                    <Mail className="size-3 shrink-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ),
    },
  ];

  return (
    <>
      <EntityDetailLayout
        icon={
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-muted">
            <Megaphone className="size-4" />
          </span>
        }
        title={card.title}
        actions={
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t`Share`}
              onClick={onShare}
            >
              <Share2 />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={t`Card actions`}
                  />
                }
              >
                <MoreVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>{t`Update`}</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                  {t`Delete`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        sidebarItems={sidebarItems}
        attachments={null}
        className={className}
      >
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold">{t`Description`}</span>
          <MarkdownEditor
            markdown={description}
            onChange={onDescriptionChange}
            placeholder={t`Add a description…`}
            saveStatus={descriptionSaveStatus}
            className="min-h-24 max-h-[32rem] rounded-lg border px-4 py-3 text-sm leading-relaxed [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1"
          />
        </div>
      </EntityDetailLayout>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t`Delete card?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {t`This will permanently delete this card. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeleteConfirmOpen(false);
                onDelete();
              }}
            >
              {t`Delete`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
