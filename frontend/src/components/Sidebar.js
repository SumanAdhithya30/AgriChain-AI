"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  Sprout,
  ClipboardList,
  LineChart,
  Settings,
  LogOut,
  Leaf,
  Truck,
  User,
  FileText,
  ShieldAlert,
} from "lucide-react";

const sidebarItems = [
  {
    category: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    category: "Marketplace",
    items: [
      { name: "Marketplace", href: "/marketplace", icon: Store },
      { name: "My Listings", href: "/list-product", icon: ClipboardList },
      { name: "My Agreements", href: "/agreements", icon: FileText },
    ],
  },
  {
    category: "Services",
    items: [
      { name: "Yield Prediction", href: "/yield-prediction", icon: Sprout },
      { name: "Traceability", href: "/track", icon: LineChart },
    ],
  },
  {
    category: "Account",
    items: [
      { name: "My Profile", href: "/register", icon: User },
    ],
  },
  {
    category: "Admin",
    items: [
       { name: "Add Update", href: "/add-update", icon: LineChart },
       { name: "Dispute Resolution", href: "/admin", icon: ShieldAlert },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar border-r border-border hidden md:flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Leaf className="w-6 h-6 text-primary mr-2" />
        <span className="text-xl font-bold font-sans text-foreground">AgriChain</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        {sidebarItems.map((group, index) => (
          <div key={index}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
              {group.category}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Link
          href="/settings"
          className="flex items-center px-2 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </Link>
        <button className="w-full flex items-center px-2 py-2 mt-1 text-sm font-medium text-destructive rounded-md hover:bg-destructive/10 transition-colors">
          <LogOut className="mr-3 h-5 w-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
