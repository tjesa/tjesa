import { Cinzel, Outfit } from "next/font/google";
import "./globals.css";
import "../lib/poller";


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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}

