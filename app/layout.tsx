import { Geist, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { authorize } from "@/lib/authorization";
import { cn } from "@/lib/utils";
import Providers from "./providers";

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

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>
          <main>
            <nav
              className={cn(
                "flex items-start justify-center gap-2 flex-col py-8 px-6 max-w-2xl mx-auto",
              )}
            >
              <span className={cn("text-4xl font-bold", playfair.className)}>
                Hello {user?.user_metadata.displayName}
              </span>
              <span className="uppercase text-xs">let's prepare a meal!</span>
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-sm border px-2 py-1 rounded-md border-white"
                >
                  Home
                </Link>
                <Link
                  href="/meals"
                  className="text-sm border px-2 py-1 rounded-md border-white"
                >
                  Meals
                </Link>
              </div>
            </nav>

            <div className="">{children}</div>

            <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
              Meal-prep
            </footer>
          </main>
        </Providers>
      </body>
    </html>
  );
}
