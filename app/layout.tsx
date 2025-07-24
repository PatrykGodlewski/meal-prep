import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { getTranslations } from "next-intl/server";
import { Geist } from "next/font/google";
import Providers from "./providers";

import "./globals.css";

export async function generateMetadata() {
  const t = await getTranslations("layout");
  return {
    title: "Skibidi Obiadex",
    description: t("description"),
  };
}

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
