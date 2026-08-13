"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Video } from "lucide-react";
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
  const [ready, setReady] = useState(false);

  /*
   * Jitsi reads these from the URL hash.
   *
   * The prejoin screen is deliberately left on: it is where someone can turn
   * their camera off *before* anyone sees them, which matters more here than
   * saving a tap. Our own gate below is a separate thing — it stops the iframe
   * loading at all until the student asks for it.
   *
   * Deep linking is off so a phone never tries to bounce the call into the
   * Jitsi app, and the app promo banner is hidden for the same reason.
   */
  const config = new URLSearchParams({
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
    <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
      {/* Jitsi takes a few seconds to boot. Without this the student stares at
          a black rectangle and reasonably assumes it has broken. */}
      {!ready ? (
        <div className="absolute inset-0 grid place-items-center bg-black text-white/70">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <p className="text-sm">Connecting…</p>
          </div>
        </div>
      ) : null}

      <iframe
        title="Video session"
        src={`https://${domain}/${roomId}#${config.toString()}`}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        onLoad={() => setReady(true)}
        className="aspect-[3/4] w-full sm:aspect-video"
      />
    </div>
  );
}
