import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Rubik } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

const body = Rubik({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Badd Boys",
  description: "Badmintonkvöldin, leikirnir og tölfræðin.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Badd Boys" },
};

export const viewport: Viewport = {
  themeColor: "#0a0f1e",
  width: "device-width",
  initialScale: 1,
  // The score pads are large on purpose; a stray double-tap should not zoom.
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="is" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
