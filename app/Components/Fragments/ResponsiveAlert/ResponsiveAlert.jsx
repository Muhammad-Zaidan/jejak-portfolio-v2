// src/app/Components/Fragments/ResponsiveAlert.jsx
"use client"; // Komponen ini interaktif, jadi kita tandai sebagai Client Component

import React from "react";

// Komponen menerima prop 'onClose' untuk menangani event klik tombol close
export default function ResponsiveAlert({ onClose }) {
  return (
    // Backdrop overlay
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      {/* Kotak Alert */}
      <div className="w-11/12 max-w-md p-6 mx-4 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl text-white font-code transform transition-all animate-fade-in">
        <h2 className="text-xl font-bold mb-3 text-[#FF3830]">Pemberitahuan</h2>
        <p className="text-gray-300 mb-5">
          Untuk pengalaman terbaik, website ini lebih optimal diakses melalui
          layar yang lebih besar seperti laptop atau PC. 🖥️
        </p>
        <button
          onClick={onClose} // Panggil fungsi onClose saat tombol diklik
          className="w-full px-4 py-2 bg-[#FF3830] text-white rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#FF3830] focus:ring-offset-2 focus:ring-offset-[#1a1a1a] transition-colors"
        >
          Saya Mengerti
        </button>
      </div>

      {/* Tambahkan style untuk animasi fade-in sederhana */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
