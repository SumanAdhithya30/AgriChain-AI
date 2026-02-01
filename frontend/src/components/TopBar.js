"use client";

import { Bell, Search, Menu } from "lucide-react";
import ConnectWallet from "./ConnectWallet";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6 gap-4">
        {/* Mobile Menu Button (Visible only on mobile) */}
        <button className="md:hidden p-2 text-muted-foreground hover:text-foreground">
          <Menu className="h-6 w-6" />
        </button>

        {/* Search Bar - Hidden on small mobile */}
        <div className="hidden sm:flex items-center flex-1 max-w-md bg-muted/50 rounded-full px-4 py-2 text-sm text-foreground focus-within:bg-muted focus-within:ring-1 focus-within:ring-ring transition-all">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex-1 flex justify-end items-center gap-4">
          <ThemeToggle />

          <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
          </button>
          
          <div className="border-l border-border h-6 mx-2 hidden sm:block"></div>
          
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
