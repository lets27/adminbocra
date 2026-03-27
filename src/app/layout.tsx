import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import AppProviders from "./providers";
import "./globals.css";
import ConvexClientProvider from "@/components/convexClientProvider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOCRA Admin Dashboard",
  description: "Regulatory intelligence dashboard for BOCRA admin oversight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>
        <ClerkProvider>
          <ConvexClientProvider>
            <AppProviders>
              {children}
            </AppProviders>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
