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
      <body className="bg-brand-bg font-body text-brand-text antialiased">
        {children}
      </body>
    </html>
  );
}
