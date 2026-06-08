import { Cinzel, Outfit } from "next/font/google";
import "./globals.css";
import "../lib/poller";
import { ToastProvider } from "@/components/ToastProvider";
import Script from 'next/script';

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Tjesa | Notion-Integrated Suite",
  description: "Premium Notion productivity tools inspired by the golden era of Egypt, carved to perfection.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${outfit.variable}`}>
      <body>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3WY9Z105HJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-3WY9Z105HJ');
          `}
        </Script>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

