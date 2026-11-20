import type { Metadata, Viewport } from "next";
import { env } from "@/config/env";
import { SiteNameProvider } from "@/components/layout/SiteNameContext";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: `${env.site.name} - Biblioteca Digital`,
  description: "Una biblioteca de álbumes de fotos familiares con estética vintage de madera",
  icons: {
    icon: '/book-gift-present-svgrepo-com.svg',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  themeColor: "#2d1f14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-background" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,700&family=Cormorant+Garamond:ital,wght@0,500;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background min-h-screen flex flex-col">
        <SiteNameProvider name={env.site.name}>
          <div className="flex-1 flex flex-col">{children}</div>
        </SiteNameProvider>
        <Footer />
      </body>
    </html>
  );
}
