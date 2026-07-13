import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";


const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tecnasa",
  description: "Plataforma de Gestão Tecnasa",
  metadataBase: new URL("https://tecnasa-board-gules.vercel.app"),
  openGraph: {
    title: "Tecnasa",
    description: "Plataforma de Gestão Tecnasa",
    url: "https://tecnasa-board-gules.vercel.app",
    siteName: "Tecnasa",
    images: [
      {
        url: "/og-image.png", 
        width: 1200,
        height: 630,
        alt: "Tecnasa - Plataforma de Gestão",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tecnasa",
    description: "Plataforma de Gestão Tecnasa",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html
        lang="pt-BR"
        className={cn(
          "h-full",
          "antialiased",
          geistMono.variable,
          "font-sans",
          inter.variable
        )}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}