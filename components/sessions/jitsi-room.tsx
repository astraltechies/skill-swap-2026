"use client";

import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useState } from "react";

/**
 * The video call.
 *
 * The iframe is not mounted until the student presses Join, for two reasons:
 * Jitsi asks for camera and microphone the moment it loads, and an autoplaying
 * embed on a phone burns data before anyone has agreed to be on camera.
 */
export function JitsiRoom({
  roomId,
  displayName,
  domain,
}: {
  roomId: string;
  displayName: string;
  domain: string;
}) {
  const [joined, setJoined] = useState(false);

  const config = new URLSearchParams({
    // Jitsi reads these from the hash; they pre-fill the name and skip the
    // pre-join screen's noisier options.
    "userInfo.displayName": `"${displayName}"`,
    "config.prejoinPageEnabled": "true",
    "config.disableDeepLinking": "true",
    "interfaceConfig.MOBILE_APP_PROMO": "false",
  });

  if (!joined) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-line bg-surface-sunk px-6 py-10 text-center">
        <Video className="mb-3 size-8 text-muted" aria-hidden />
        <h3 className="font-display text-base font-semibold">Ready when you are</h3>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Your browser will ask for camera and microphone access. You can turn either off
          once you are in.
        </p>
        <Button variant="learn" size="lg" className="mt-4" onClick={() => setJoined(true)}>
          <Video className="size-4" aria-hidden />
          Join the call
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-black">
      <iframe
        title="Video session"
        src={`https://${domain}/${roomId}#${config.toString()}`}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="aspect-[3/4] w-full sm:aspect-video"
      />
    </div>
  );
}
