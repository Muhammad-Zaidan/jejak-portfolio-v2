"use client";
import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

export default function LenisWrapper() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 2.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return null; // karena dia tidak render apa pun
}
