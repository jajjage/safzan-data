import { MarkupSyncer } from "@/components/MarkupSyncer";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ServiceWorkerNavigationListener } from "@/components/ServiceWorkerNavigationListener";
import { NetworkStatusBanner } from "@/components/layout/network-status-banner";
import { SoftLockScreen } from "@/components/pwa/SoftLockScreen";
import { WhatsAppWidget } from "@/components/layout/whatsapp-widget";
// import { HealthMonitor } from "@/components/HealthMonitor";
import { AuthProvider } from "@/context/AuthContext";
import { SoftLockProvider } from "@/context/SoftLockContext";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Safzan Data Sub - Premium Data & Airtime Services",
    template: "%s | Safzan Data Sub",
  },
  description:
    "Buy cheap data bundles, airtime, and pay bills instantly with Safzan Data Sub. Premium data and airtime services with instant delivery and best prices.",
  keywords: [
    "cheap data",
    "buy airtime",
    "data bundle",
    "mtn data",
    "glo data",
    "airtel data",
    "9mobile data",
    "cheap airtime nigeria",
    "data reseller",
    "bill payment",
    "safzan data",
  ],
  authors: [{ name: "Safzan Data Sub" }],
  creator: "Safzan Data Sub",
  publisher: "Safzan Data Sub",
  metadataBase: new URL("https://safzandatasub.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://safzandatasub.com",
    siteName: "Safzan Data Sub",
    title: "Safzan Data Sub - Premium Data & Airtime Services",
    description:
      "Buy cheap data bundles, airtime, and pay bills instantly. Premium data and airtime services.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Safzan Data Sub - Premium Data & Airtime Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Safzan Data Sub - Premium Data & Airtime Services",
    description: "Buy cheap data bundles, airtime, and pay bills instantly.",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Safzan Data Sub",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/images/favicon.ico",
    apple: "/images/ios-light.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Safzan Data Sub",
    "theme-color": "#ffffff",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        {/* Dynamic theme-color based on system preference */}
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#09090b"
          media="(prefers-color-scheme: dark)"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Safzan Data" />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <SoftLockProvider>
                {/* <HealthMonitor> */}
                <div data-app-root>
                  <NetworkStatusBanner />
                  <MarkupSyncer />
                  <ServiceWorkerNavigationListener />
                  <PWAInstallPrompt />
                  {/* <FcmSyncer /> */}
                  <Toaster richColors position="top-right" />
                  <SoftLockScreen />
                  {children}
                  <WhatsAppWidget />
                </div>
                {/* </HealthMonitor> */}
              </SoftLockProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
