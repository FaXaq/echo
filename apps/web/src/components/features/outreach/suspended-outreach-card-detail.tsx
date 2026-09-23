import { Suspense, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { OutreachCardDetail } from "@/components/ui/outreach/outreach-card-detail";
import type { MarkdownSaveStatus } from "@/components/ui/markdown-editor";
import { useSyncPageMeta } from "@/contexts/page-meta";
import {
  getOutreachCardQueryOptions,
  listOutreachCardContactsQueryOptions,
  listOutreachColumnsQueryOptions,
  useDeleteOutreachCardMutation,
  useUpdateOutreachCardDescriptionMutation,
} from "@/services/resources/outreach";
import { OutreachCardDialog, type OutreachCardDialogState } from "./outreach-card-dialog";

const DESCRIPTION_AUTOSAVE_DEBOUNCE_MS = 300;

export interface SuspendedOutreachCardDetailProps {
  cardId: string;
  organizationId: string;
  pathname: string;
  onBack: () => void;
}

function OutreachCardDetailContent({
  cardId,
  organizationId,
  pathname,
  onBack,
}: SuspendedOutreachCardDetailProps) {
  const { t } = useLingui();
  const { data: card } = useSuspenseQuery(getOutreachCardQueryOptions({ cardId, organizationId }));
  const { data: columns } = useSuspenseQuery(listOutreachColumnsQueryOptions({ organizationId }));
  const { data: contacts } = useSuspenseQuery(
    listOutreachCardContactsQueryOptions({ organizationId, cardId }),
  );
  const [dialogState, setDialogState] = useState<OutreachCardDialogState>(null);
  const [description, setDescription] = useState(() => card.description ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descriptionRef = useRef(description);
  descriptionRef.current = description;

  useSyncPageMeta(pathname, card.title, card.title);

  const updateDescriptionMutation = useUpdateOutreachCardDescriptionMutation({
    organizationId,
    onError: () => toast.add({ type: "error", title: t`Failed to save description` }),
  });
  const deleteCardMutation = useDeleteOutreachCardMutation();

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        updateDescriptionMutation.mutate({
          id: card.id,
          description: descriptionRef.current || null,
        });
      }
    };
  }, [card.id, updateDescriptionMutation.mutate]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.add({ type: "success", title: t`Link copied to clipboard` });
  };

  const handleDescriptionChange = (markdown: string) => {
    setDescription(markdown);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      updateDescriptionMutation.mutate({ id: card.id, description: markdown || null });
    }, DESCRIPTION_AUTOSAVE_DEBOUNCE_MS);
  };

  const descriptionSaveStatus: MarkdownSaveStatus =
    updateDescriptionMutation.isPending || debounceRef.current !== null
      ? "saving"
      : updateDescriptionMutation.isSuccess
        ? "saved"
        : "idle";

  const handleDelete = async () => {
    try {
      await deleteCardMutation.mutateAsync({ organizationId, id: card.id });
      toast.add({ type: "success", title: t`Card deleted` });
      onBack();
    } catch {
      toast.add({ type: "error", title: t`Couldn't delete card` });
    }
  };

  const columnName = columns.find((column) => column.id === card.columnId)?.name ?? "—";

  return (
    <>
      <OutreachCardDetail
        card={card}
        columnName={columnName}
        contacts={contacts}
        description={description}
        onDescriptionChange={handleDescriptionChange}
        descriptionSaveStatus={descriptionSaveStatus}
        onShare={handleShare}
        onEdit={() => setDialogState({ mode: "edit", card })}
        onDelete={handleDelete}
      />
      <OutreachCardDialog
        organizationId={organizationId}
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
      />
    </>
  );
}

function OutreachCardDetailSkeleton() {
  return (
    <div className="flex flex-wrap-reverse gap-9">
      <div className="flex min-w-[280px] flex-[999_1_400px] flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="flex min-w-[200px] max-w-[280px] flex-[1_1_220px] flex-col gap-2">
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function OutreachCardDetailError({ error, onBack }: { error: unknown; onBack: () => void }) {
  const { t } = useLingui();
  const isNotFound = error instanceof TRPCClientError && error.data?.code === "NOT_FOUND";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">
        {isNotFound ? t`Card not found` : t`Something went wrong`}
      </h1>
      {isNotFound && (
        <p className="text-muted-foreground">{t`This card doesn't exist or has been deleted.`}</p>
      )}
      <Button type="button" onClick={onBack}>
        {t`Back to Outreach`}
      </Button>
    </div>
  );
}

export function SuspendedOutreachCardDetail({
  cardId,
  organizationId,
  pathname,
  onBack,
}: SuspendedOutreachCardDetailProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <OutreachCardDetailError error={error} onBack={onBack} />}
    >
      <Suspense fallback={<OutreachCardDetailSkeleton />}>
        <OutreachCardDetailContent
          cardId={cardId}
          organizationId={organizationId}
          pathname={pathname}
          onBack={onBack}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
