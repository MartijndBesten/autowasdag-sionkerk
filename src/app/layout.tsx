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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://autowasdagsionkerk.nl";

const TITLE       = "Autowasdag Sionkerk Houten – 11 juli 2026";
const DESCRIPTION = "Laat uw auto wassen door de jongeren van de Sionkerk. Zaterdag 11 juli 2026 van 09:00 tot 16:00 uur. Kies voor Buitenwas of Compleet en steun de opknapbeurt van de kerkzalen.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:  TITLE,
    template: "%s — Autowasdag Sionkerk Houten",
  },
  description: DESCRIPTION,
  keywords: [
    "autowasdag", "Sionkerk", "Houten", "auto wassen",
    "jongeren", "11 juli 2026", "Eikenhout 221",
  ],
  authors: [{ name: "Sionkerk Houten" }],
  openGraph: {
    type:        "website",
    locale:      "nl_NL",
    url:         BASE_URL,
    siteName:    "Autowasdag Sionkerk Houten",
    title:       TITLE,
    description: DESCRIPTION,
    images: [
      {
        url:    "/images/hero.jpg",
        width:  1200,
        height: 630,
        alt:    "Autowasdag Sionkerk Houten – 11 juli 2026",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       TITLE,
    description: DESCRIPTION,
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
