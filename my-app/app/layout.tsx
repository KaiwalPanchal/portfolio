import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { GlassProvider, WebGLGlassBackground } from "@/components/webgl-glass"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

export const metadata: Metadata = {
  title: "Felix Macaspac - HubSpot CMS Developer",
  description: "HubSpot CMS Developer from Philippines with 5 years of experience.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="font-sans antialiased">
        <GlassProvider>
          <WebGLGlassBackground />
          <div style={{ position: "relative", zIndex: 1, pointerEvents: "none" }}>
            <div style={{ pointerEvents: "auto" }}>{children}</div>
          </div>
        </GlassProvider>
      </body>
    </html>
  )
}

