"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./Icon";

export type Theme = "light" | "dark";

export const themeStorageKey = "northstar-theme";

/**
 * Runs before paint so the saved theme is on <html> before anything renders.
 * Kept as a string because it has to be inlined in the document head.
 */
export const themeBootScript = `(function(){try{var s=localStorage.getItem("${themeStorageKey}");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=s||(d?"dark":"light")}catch(e){}})()`;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Private browsing: the choice just will not survive a reload.
  }
  listeners.forEach((listener) => listener());
}

/** The theme every client component reads, kept in sync across all of them. */
export function useTheme() {
  const theme = useSyncExternalStore<Theme>(subscribe, current, () => "light");

  return { theme, setTheme: apply, toggle: () => apply(current() === "dark" ? "light" : "dark") };
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon name={dark ? "sun" : "moon"} style={{ width: 15, height: 15 }} />
      {dark ? "Light" : "Dark"}
    </button>
  );
}
