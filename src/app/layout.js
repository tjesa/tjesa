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
  title: {
    default: "Tjesa | Notion Forms, QR Codes & Productivity Suite",
    template: "%s | Tjesa Suite",
  },
  description: "Supercharge Notion databases with Tjesa. Generate dynamic QR codes, build custom web forms, visualize interactive charts, and automate workflows seamlessly.",
  keywords: [
    "Notion integrations",
    "Notion QR code generator",
    "Notion forms builder",
    "Notion database sync",
    "Notion automation",
    "Notion charts",
    "Notion CMS publisher",
    "Notion to PDF",
    "Tjesa Suite"
  ],
  metadataBase: new URL("https://tjesa.com"),
  openGraph: {
    title: "Tjesa | Notion Forms, QR Codes & Productivity Suite",
    description: "Supercharge Notion databases with Tjesa. Generate dynamic QR codes, build custom web forms, visualize interactive charts, and automate workflows seamlessly.",
    url: "https://tjesa.com",
    siteName: "Tjesa Suite",
    images: [
      {
        url: "/favicon.svg",
        width: 512,
        height: 512,
        alt: "Tjesa Notion-Integrated Suite",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tjesa | Notion Forms, QR Codes & Productivity Suite",
    description: "Supercharge Notion databases with Tjesa. Generate dynamic QR codes, build custom web forms, visualize interactive charts, and automate workflows seamlessly.",
    images: ["/favicon.svg"],
  },
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

        {/* Meta Pixel */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

