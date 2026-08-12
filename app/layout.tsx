import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Skill Swap — Learn from a classmate, teach what you know",
    template: "%s · Skill Swap",
  },
  description:
    "A student-to-student skill exchange. Teach the thing you are good at, earn SkillCoins, and spend them learning something new. Every session runs on video, with guardian consent built in.",
  applicationName: "Skill Swap",
  openGraph: {
    type: "website",
    siteName: "Skill Swap",
    title: "Skill Swap — Learn from a classmate, teach what you know",
    description:
      "Teach what you know, learn what you don't. A safe, student-run skill exchange.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Light is the default on every device now, so the browser chrome matches
  // the page ground rather than tracking the OS setting the app ignores.
  themeColor: "#faf9f6",
};

/**
 * Applies a saved theme before the first paint.
 *
 * Light is the default, so this only has to act for someone who has chosen
 * dark — without it they would see a white flash on every navigation while
 * React hydrated. Deliberately tiny and synchronous, and wrapped in try/catch
 * because Safari throws on localStorage in private mode.
 */
const themeScript = `
try {
  var t = localStorage.getItem("skillswap-theme");
  if (t === "dark") document.documentElement.dataset.theme = "dark";
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable} h-full antialiased`}
      // The inline script writes data-theme before React sees the document.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
