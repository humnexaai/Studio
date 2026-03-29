import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Humnexa Studio",
  description: "Idea → App → Launch → Earn",
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
