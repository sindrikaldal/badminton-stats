import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// One family for everything: extra-condensed caps for scores and labels, normal
// width for reading. The width axis carries the difference.
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Badd Boys",
  description: "Badmintonkvöldin, leikirnir og tölfræðin.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Badd Boys" },
};

export const viewport: Viewport = {
  themeColor: "#eef1ec",
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
    <html lang="is" className={archivo.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
