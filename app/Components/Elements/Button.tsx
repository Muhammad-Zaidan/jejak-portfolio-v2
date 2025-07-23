"use client";

import React from "react";
import type { ReactNode } from "react";

interface ButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function Button({
  href,
  children,
  className = "",
}: ButtonProps) {
  return (
    <a
      href={href}
      className={`
        inline-block px-6 py-2 rounded-full
        bg-gradient-to-r from-[#FF3830] via-[#a21c1a] to-[#6d1311]
        hover:from-[#e13a29] hover:via-[#861714] hover:to-[#540f0d]
        text-black font-semibold text-sm
        shadow-md hover:shadow-lg
        transition-all duration-200 ease-in-out
        hover:scale-[1.02]
        cursor-pointer
        ${className}
      `}
    >
      {children}
    </a>
  );
}
