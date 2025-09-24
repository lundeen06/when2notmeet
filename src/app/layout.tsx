import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ResponsiveNavigation } from "@/components/responsive-navigation";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "when2notmeet",
  description: "A clean scheduling app - mark when you're NOT available to find the best meeting times",
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
          <div className="duck-background">
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
            <div className="duck-float"><img src="/duck-icon.png" alt="" className="pixelated" /></div>
          </div>
          <div className="md:flex h-screen">
            <ResponsiveNavigation />
            <div className="flex-1 flex flex-col md:pt-0 pt-12">
              <main className="flex-1 overflow-auto">
                {children}
              </main>
              <Footer />
            </div>
          </div>
      </body>
    </html>
  );
}
