import type { Metadata } from "next";
import {
  JetBrains_Mono,
  Fira_Code,
  Source_Code_Pro,
  IBM_Plex_Mono,
  Ubuntu_Mono,
  Inconsolata,
  Roboto_Mono,
  DM_Mono,
} from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import Script from "next/script";
import "./globals.scss";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ubuntuMono = Ubuntu_Mono({
  subsets: ["latin"],
  variable: "--font-ubuntu-mono",
  weight: ["400", "700"],
  display: "swap",
});

const inconsolata = Inconsolata({
  subsets: ["latin"],
  variable: "--font-inconsolata",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MindMatrix — Collaborative Markdown Knowledge Hub",
    template: "%s | MindMatrix",
  },
  description: "Markdown-first, self-hosted, multi-user knowledge hub for teams and thinkers.",
  keywords: ["markdown", "wiki", "knowledge base", "self-hosted", "obsidian-alternative", "team collaboration", "document editor", "real-time collab", "Yjs", "Webhooks", "Git sync"],
  authors: [{ name: "mojoaar", url: "https://github.com/mojoaar/mindmatrix" }],
  creator: "mojoaar",
  publisher: "MindMatrix",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/mojoaar/mindmatrix",
    siteName: "MindMatrix",
    title: "MindMatrix — Collaborative Markdown Knowledge Hub",
    description: "Markdown-first, self-hosted, multi-user knowledge hub for teams and thinkers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MindMatrix — Collaborative Markdown Knowledge Hub",
    description: "Markdown-first, self-hosted, multi-user knowledge hub for teams and thinkers.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icon.svg?v=2",
        color: "#5e81ac",
      },
    ],
  },
};

export const viewport = {
  themeColor: "#2e3440",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${firaCode.variable} ${sourceCodePro.variable} ${ibmPlexMono.variable} ${ubuntuMono.variable} ${inconsolata.variable} ${robotoMono.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${jetbrainsMono.variable} ${firaCode.variable} ${sourceCodePro.variable} ${ibmPlexMono.variable} ${ubuntuMono.variable} ${inconsolata.variable} ${robotoMono.variable} ${dmMono.variable}`}
      >
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('mindmatrix-theme');
                  if (saved) {
                    document.documentElement.setAttribute('data-theme', saved);
                  } else {
                    document.documentElement.setAttribute('data-theme', 'nord-dark');
                  }

                  var font = localStorage.getItem('mindmatrix-font');
                  if (font) {
                    document.documentElement.setAttribute('data-font', font);
                  } else {
                    document.documentElement.setAttribute('data-font', 'jetbrains-mono');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
        <Script id="sw-register" strategy="afterInteractive">
          {`if (!window.__TAURI__ && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
              .then(function(reg) { console.log('SW registered:', reg.scope); })
              .catch(function() {});
          }`}
        </Script>
      </body>
    </html>
  );
}
