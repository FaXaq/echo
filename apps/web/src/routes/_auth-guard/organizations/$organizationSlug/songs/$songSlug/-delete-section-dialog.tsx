import { useTranslation, Trans } from "react-i18next";
import { Button } from "@/ui/button";

type Props = {
  sectionName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
};

export function DeleteSectionDialog({ sectionName, onConfirm, onCancel, isPending }: Props) {
  const { t } = useTranslation("songs");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-semibold text-lg"><Trans t={t}>Remove section</Trans></h2>
        <p className="text-sm text-muted-foreground">
          {t("Remove \"{{name}}\" from the song structure? The section definition will be kept.", { name: sectionName })}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            <Trans t={t}>Cancel</Trans>
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <Trans t={t}>Removing…</Trans> : <Trans t={t}>Remove</Trans>}
          </Button>
        </div>
      </div>
    </div>
  );
}
