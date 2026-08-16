import { Progress, ProgressLabel, ProgressValue } from "@/ui/progress";

export function formatBytes(bytes: number) {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

export interface UsageBarProps {
  label: string;
  used: string;
  limit: string;
  ratio: number;
}

export function UsageBar({ label, used, limit, ratio }: UsageBarProps) {
  const percent = Math.min(100, Math.round(ratio * 100));
  return (
    <Progress value={percent}>
      <ProgressLabel>{label}</ProgressLabel>
      <ProgressValue>{() => `${used} / ${limit}`}</ProgressValue>
    </Progress>
  );
}
