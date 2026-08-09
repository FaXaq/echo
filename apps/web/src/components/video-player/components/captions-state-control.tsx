"use client";

import { ClosedCaptioningIcon } from "@phosphor-icons/react";

import { Button } from "@/components/video-player/components/button";
import { useCaptionsStore } from "@/hooks/limeplay/use-captions";
import { CaptionsControl } from "@/components/limeplay/captions";

export function CaptionsStateControl() {
  const textTrackVisible = useCaptionsStore((state) => state.visible);

  return (
    <CaptionsControl asChild>
      <Button className="cursor-pointer" size="icon" variant="glass">
        <ClosedCaptioningIcon weight={textTrackVisible ? "fill" : "bold"} />
      </Button>
    </CaptionsControl>
  );
}
