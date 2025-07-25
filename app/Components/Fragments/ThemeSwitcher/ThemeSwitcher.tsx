"use client";

import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false); // Hindari hydration mismatch

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("color-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const shouldUseDark = stored === "dark" || (!stored && prefersDark);
    setIsDark(shouldUseDark);

    document.documentElement.classList.toggle("dark", shouldUseDark);
    document.documentElement.classList.toggle("light", !shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    localStorage.setItem("color-theme", newTheme);
    document.documentElement.classList.toggle("dark", !isDark);
    document.documentElement.classList.toggle("light", isDark);
    alert("Trying to get blind?");
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center gap-2  rounded-full p-2 transition-all duration-500 
      ${isDark ? " text-gray-300 bg-gray-800" : "text-gray-800 bg-white/80"} shadow-lg`}
      aria-label="Toggle Theme"
    >
      {/* Sun icon */}
      <svg
        className={`w-5 h-5 transition-opacity duration-500 ${isDark ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
        />
      </svg>

      {/* Moon icon */}
      <svg
        className={`w-5 h-5 absolute transition-opacity duration-500 ${isDark ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    </button>
  );
};

export default ThemeSwitcher;
