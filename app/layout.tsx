import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BB Gym Tracker",
  description: "A mobile-first workout tracker for serious gym logging.",
  applicationName: "BB Gym Tracker",
  appleWebApp: {
    capable: true,
    title: "BB Gym",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="safe-area-shell">{children}</main>
      </body>
    </html>
  );
}
