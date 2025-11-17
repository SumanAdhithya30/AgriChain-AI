// src/app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar"; // IMPORT THE NAVBAR

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AgriChain",
  description: "A Transparent Agricultural Supply Chain",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar /> {/* USE THE NAVBAR HERE */}
        {children}
      </body>
    </html>
  );
}