import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"

import { DM_Sans, Space_Grotesk, Space_Mono, Source_Serif_4 } from 'next/font/google'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { CartInitializer } from "@/components/providers/CartInitializer"
import { CartDrawer } from "@/components/cart/CartDrawer"

// Initialize fonts
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000"],
  variable: '--font-dm-sans'
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ["300", "400", "500", "600", "700"],
  variable: '--font-space-grotesk'
})
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ["400", "700"],
  variable: '--font-space-mono'
})
const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: '--font-source-serif'
})

export const metadata: Metadata = {
  title: "BRUTAL | Bold Fashion for Bold People",
  description:
    "Unapologetically bold designs for those who refuse to blend in. Shop the latest streetwear, essentials, and accessories.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${sourceSerif4.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <CartInitializer />
            <SiteHeader />
            {children}
            <SiteFooter />
            <CartDrawer />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  border: '4px solid black',
                  borderRadius: '12px',
                  boxShadow: '4px 4px 0px #000',
                  fontWeight: 600,
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}

