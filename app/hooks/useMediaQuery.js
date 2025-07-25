"use client"; // Hook ini menggunakan browser API (window), jadi harus client-side

import { useState, useEffect } from "react";

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Pastikan kode ini hanya berjalan di client, di mana 'window' tersedia
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query);

      // Fungsi untuk update state saat ukuran layar berubah
      const listener = () => {
        setMatches(media.matches);
      };

      // Panggil sekali di awal untuk set state awal
      listener();

      // Tambahkan event listener untuk memantau perubahan
      media.addEventListener("change", listener);

      // Cleanup: hapus listener saat komponen di-unmount untuk mencegah memory leak
      return () => media.removeEventListener("change", listener);
    }
  }, [query]);

  return matches;
};
