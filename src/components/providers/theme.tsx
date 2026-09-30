"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>("system");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pp_theme");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "light" || saved === "dark" || saved === "system") setThemeState(saved);
    } catch { /* ignore */ }
  }, []);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem("pp_theme", t); } catch { /* ignore */ }
    apply(t);
  }, []);
  return [theme, setTheme];
}
