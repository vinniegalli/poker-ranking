import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const Navbar = dynamic(() => import('@/components/Navbar').then(m => ({ default: m.Navbar })), {
  ssr: false,
  loading: () => (
    <header className="sticky top-0 z-50 border-b border-border h-14 bg-felt/95" />
  ),
});

const Toaster = dynamic(() => import('@/components/ui/toaster').then(m => ({ default: m.Toaster })), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Stacks",
  description: "Ranking de cash game doméstico",
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
        <main className="min-h-screen">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
