import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { barsToText, textToBars, type Bar } from "@echo/modules/song/domain";

import { FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export function ChordChartTextEditor({
  bars,
  onChange,
}: {
  bars: Bar[];
  onChange: (bars: Bar[]) => void;
}) {
  const { t } = useLingui();
  const [text, setText] = useState(() => barsToText(bars));
  const result = textToBars(text);
  let error: string | null = null;
  if (!result.ok) {
    const { bar, token } = result;
    error = t`Bar ${bar}: "${token}" isn't a chord`;
  }

  function handleChange(value: string) {
    setText(value);
    const parsed = textToBars(value);
    if (parsed.ok && parsed.bars.length > 0) onChange(parsed.bars);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Textarea
        aria-label={t`Chord chart as text`}
        aria-invalid={error !== null}
        spellCheck={false}
        className="font-mono text-base leading-relaxed whitespace-pre"
        value={text}
        onChange={(event) => handleChange(event.target.value)}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
