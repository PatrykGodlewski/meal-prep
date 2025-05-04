import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

export const metadata = {
  title: "Skibidi Obiadex",
  description: "The fastest way to plan meals for a week",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ConvexAuthNextjsServerProvider>
          <Providers>{children}</Providers>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
