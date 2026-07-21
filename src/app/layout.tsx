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

const TITLE       = "Autowasdag Sionkerk Houten – Bedankt voor 2026";
const DESCRIPTION = "De Autowasdag 2026 van de Sionkerk in Houten was een geslaagde dag. Bedankt aan alle bezoekers, vrijwilligers en sponsoren. Mogelijk volgt in 2027 een nieuwe editie.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:  TITLE,
    template: "%s — Autowasdag Sionkerk Houten",
  },
  description: DESCRIPTION,
  keywords: [
    "autowasdag", "Sionkerk", "Houten", "auto wassen",
    "jongeren", "2026", "terugblik", "Eikenhout 221",
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
        alt:    "Autowasdag Sionkerk Houten – Terugblik 2026",
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
