import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import WebVitalsReporter from "@/components/analytics/WebVitalsReporter";

const defaultTitle = "Humnexa Studio - India's First AI App Builder";
const defaultDescription =
  "Build any app with AI. UPI payments Hindi support 40 plus languages. India first.";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://studio.humnexa.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: defaultTitle,
    template: "%s | Humnexa Studio",
  },
  description: defaultDescription,
  keywords: [
    "humnexa",
    "ai app builder",
    "india",
    "upi",
    "hindi",
    "lovable alternative",
    "no code",
    "bolt alternative",
    "replit alternative",
    "india stack",
    "razorpay subscriptions",
    "gst billing app",
    "whatsapp integration",
    "upi autopay",
    "ai website builder india",
    "ai mobile app builder",
    "nextjs supabase starter",
    "no code india",
    "vibe coding india",
    "humnexa studio",
    "developer app platform",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: appUrl,
    siteName: "Humnexa Studio",
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Humnexa Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#FF6B2C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Humnexa Studio" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" hrefLang="en-IN" href={appUrl} />
        <link rel="alternate" hrefLang="hi-IN" href={appUrl} />
      </head>
      <body className="bg-brand-bg font-body text-brand-text antialiased">
        <Providers>
          <WebVitalsReporter />
          {children}
        </Providers>
      </body>
    </html>
  );
}
