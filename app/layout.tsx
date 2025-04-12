import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import { authorize } from "@/lib/authorization";
import Providers from "./providers";
import { getProfile } from "@/lib/getProfile";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await authorize();
  const profile = await getProfile();

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>
          <main className="flex flex-col gap-8">
            <SidebarProvider>
              <AppSidebar variant="inset" />
              <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                  <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                      <div className="container">{children}</div>
                    </div>
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </main>
        </Providers>
      </body>
    </html>
  );
}
