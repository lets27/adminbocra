import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
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
              <div className="min-h-screen">
                <header className="border-b border-white/55 bg-white/70 backdrop-blur-xl">
                  <div className="mx-auto flex h-20 w-full max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                        BOCRA
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          Admin Regulatory Dashboard
                        </p>
                        <p className="text-sm text-slate-500">
                          Escalations, licensing, oversight, and analytics
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Show when="signed-out">
                        <SignInButton>
                          <button className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-950 hover:text-slate-950">
                            Sign in
                          </button>
                        </SignInButton>
                        <SignUpButton>
                          <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                            Create admin
                          </button>
                        </SignUpButton>
                      </Show>
                      <Show when="signed-in">
                        <UserButton />
                      </Show>
                    </div>
                  </div>
                </header>
                {children}
              </div>
            </AppProviders>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
