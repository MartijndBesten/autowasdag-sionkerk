import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ModalProvider } from "@/context/ModalContext";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://autowasdag.sionkerk.nl";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Autowasdag Sionkerk Houten",
    template: "%s — Autowasdag Sionkerk Houten",
  },
  description:
    "Laat uw auto wassen door de jeugdclubs van de Sionkerk op zaterdag 5 september. Koffie, gebak, friet en gezelligheid. Opbrengst voor de zalen.",
  keywords: ["autowasdag", "Sionkerk", "Houten", "auto wassen", "jeugdclubs", "5 september"],
  authors: [{ name: "Sionkerk Houten" }],
  openGraph: {
    type:        "website",
    locale:      "nl_NL",
    url:         BASE_URL,
    siteName:    "Autowasdag Sionkerk Houten",
    title:       "Autowasdag Sionkerk Houten",
    description: "Laat uw auto wassen door de jongeren van de Sionkerk. Zaterdag 5 september, 09:00–16:00, Eikenhout 221 Houten.",
    images: [
      {
        url:   "/og-image.jpg",
        width:  1200,
        height: 630,
        alt:   "Autowasdag Sionkerk Houten",
      },
    ],
  },
  twitter: {
    card:  "summary_large_image",
    title: "Autowasdag Sionkerk Houten",
    description: "Zaterdag 5 september · Eikenhout 221 Houten · Jeugdclubs actie",
  },
  robots: { index: true, follow: true },
  icons: {
    icon:  "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={jakarta.variable}>
      <body className="antialiased font-jakarta">
        <ModalProvider>{children}</ModalProvider>
      </body>
    </html>
  );
}
