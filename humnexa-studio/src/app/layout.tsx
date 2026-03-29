import type { Metadata } from "next";
import "./globals.css";

const defaultTitle = "Humnexa Studio - India's First AI App Builder";
const defaultDescription =
  "Build any app with AI in minutes. UPI payments, Hindi support, 40+ languages. India first.";

export const metadata: Metadata = {
  metadataBase: new URL("https://studio.humnexa.com"),
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
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://studio.humnexa.com",
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
      </head>
      <body className="bg-brand-bg font-body text-brand-text antialiased">
        {children}
      </body>
    </html>
  );
}
