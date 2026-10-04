import { CircleCheck } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money";

export interface SuggestedRepaymentEntry {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amountMinor: number;
}

export function SuggestedRepaymentList({
  entries,
  currency,
  onRecord,
}: {
  entries: SuggestedRepaymentEntry[];
  currency: string;
  onRecord: (entry: SuggestedRepaymentEntry) => void;
}) {
  const { t, i18n } = useLingui();

  if (entries.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleCheck />
          </EmptyMedia>
          <EmptyTitle>{t`Everyone is settled up.`}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table className="m-0">
        <TableHeader>
          <TableRow>
            <TableHead>{t`From`}</TableHead>
            <TableHead>{t`To`}</TableHead>
            <TableHead className="text-right">{t`Amount`}</TableHead>
            <TableHead className="w-24">
              <span className="sr-only">{t`Actions`}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={`${entry.fromUserId}-${entry.toUserId}`}>
              <TableCell className="font-medium">{entry.fromName}</TableCell>
              <TableCell className="font-medium">{entry.toName}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(entry.amountMinor, currency, i18n.locale)}
              </TableCell>
              <TableCell className="text-right">
                <Button type="button" size="sm" variant="outline" onClick={() => onRecord(entry)}>
                  {t`Record`}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
