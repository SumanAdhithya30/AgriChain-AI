// src/app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AgriChain",
  description: "A Transparent Agricultural Supply Chain",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-secondary/20">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}