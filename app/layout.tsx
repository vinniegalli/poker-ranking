import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const Navbar = dynamic(() => import('@/components/Navbar').then(m => ({ default: m.Navbar })), {
  ssr: false,
  loading: () => (
    <header className="sticky top-0 z-50 border-b border-border h-14 bg-felt/95" />
  ),
});

const BottomNav = dynamic(() => import('@/components/BottomNav').then(m => ({ default: m.BottomNav })), {
  ssr: false,
});

const Toaster = dynamic(() => import('@/components/ui/toaster').then(m => ({ default: m.Toaster })), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Stacks",
  description: "Ranking de cash game doméstico",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stacks",
    startupImage: "/icons/apple-touch-icon.png",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Resize the layout when the on-screen keyboard opens (Android/Chrome),
  // so centered dialogs stay above the keyboard instead of hiding behind it.
  interactiveWidget: "resizes-content",
  themeColor: "#121113",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <Navbar />
        {/* pb-24 on mobile gives room above the bottom nav tab bar */}
        <main className="min-h-screen pb-24 sm:pb-0">{children}</main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
