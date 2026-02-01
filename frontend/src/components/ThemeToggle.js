"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-16 h-8 rounded-full bg-muted" />; // Placeholder to prevent hydration mismatch
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div
      onClick={toggleTheme}
      className={`relative w-24 h-10 flex items-center bg-gray-200 dark:bg-gray-800 rounded-full p-1 cursor-pointer transition-colors duration-300 shadow-inner`}
      aria-label="Toggle Dark Mode"
    >
      {/* Sliding Thumb */}
      <motion.div
        className="absolute w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-md z-10"
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 30,
        }}
        initial={false}
        animate={{
          x: isDark ? "3.75rem" : "0.25rem",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      />

      {/* Icons Container - Absolute overlay for perfect alignment */}
      <div className="absolute inset-0 flex justify-between items-center px-2 z-20 pointer-events-none">
        <Sun
            className={`w-6 h-6 transition-colors duration-300 ${
                !isDark ? "text-orange-500" : "text-gray-400"
            }`}
        />
        <Moon
            className={`w-6 h-6 transition-colors duration-300 ${
                isDark ? "text-blue-400" : "text-gray-400"
            }`}
        />
      </div>
    </div>
  );
}
