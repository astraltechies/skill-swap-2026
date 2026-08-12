import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * Firebase Auth needs its own frames for the Google sign-in popup, Firestore
 * holds a long-lived connection over googleapis, and the video session embeds
 * Jitsi in an iframe. Everything else is denied, so an injected script has no
 * host it is allowed to talk to.
 */
const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? "meet.jit.si";

const csp = [
  "default-src 'self'",
  // Firebase's JS SDK evaluates code it fetches; 'unsafe-inline' is required
  // for Next's inlined bootstrap script.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "wss://*.firebaseio.com",
    "https://*.firebaseapp.com",
    "https://securetoken.googleapis.com",
    "https://identitytoolkit.googleapis.com",
  ].join(" "),
  `frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://${JITSI_DOMAIN}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // Camera and mic stay enabled for the video session; everything
            // else a browser could expose is switched off.
            value: "geolocation=(), interest-cohort=(), payment=(), usb=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        // Never let an API response be cached by a CDN or the browser — some
        // of them are scoped to the signed-in user.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
