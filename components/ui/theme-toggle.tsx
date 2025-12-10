"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // On mount, check if <html> currently has .dark
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const hasDark = document.documentElement.classList.contains("dark");
    setIsDark(hasDark);
  }, []);

  const toggleTheme = () => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const nowDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nowDark);
    setIsDark(nowDark);
  };

  if (!mounted) return null;

  return (
    <Button variant="outline" size="sm" onClick={toggleTheme}>
      {isDark ? "Light mode" : "Dark mode"}
    </Button>
  );
}
