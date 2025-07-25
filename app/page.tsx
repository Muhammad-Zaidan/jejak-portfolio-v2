// src/app/page.js

// 1. Tandai sebagai Client Component karena kita akan menggunakan State dan Hooks
"use client";

// 2. Import hooks dan komponen yang baru dibuat
import { useState } from "react";
import { useMediaQuery } from "./hooks/useMediaQuery";
import ResponsiveAlert from "./Components/Fragments/ResponsiveAlert/ResponsiveAlert";

// ... import komponen lainnya yang sudah ada
import Image from "next/image";
import ScrollVelocity from "./Components/Fragments/ScrollVelocity/ScrollVelocity";
import Projects from "./Components/layout/Projects";
import Contacts from "./Components/layout/Contact";
import Navbar from "./Components/layout/Navbar";
import LandingPage from "./Components/layout/LandingPage";
import About from "./Components/layout/About";
import LenisWrapper from "./Components/Elements/LenisWrapper";
import DarkVeil from "./Components/Fragments/DarkVeil/DarkVeil";

export default function Home() {
  // 3. Gunakan hook untuk mendeteksi layar kecil (misalnya, lebar < 768px)
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  // 4. Buat state untuk mengontrol visibilitas alert
  const [showAlert, setShowAlert] = useState(true);

  // 5. Fungsi untuk menutup alert
  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  return (
    <>
      {/* 6. Tampilkan alert jika kondisi terpenuhi (layar kecil & alert belum ditutup) */}
      {isSmallScreen && showAlert && (
        <ResponsiveAlert onClose={handleCloseAlert} />
      )}

      <LenisWrapper />
      <div className="w-full overflow-hidden font-code relative selection:bg-[#FF3830] selection:text-white scroll-smooth">
        {/* Aurora Background */}
        <div className="absolute top-0 left-0 w-full h-screen z-[-10]">
          <DarkVeil
            speed={1.5}
            hueShift={234}
            noiseIntensity={0.05}
            scanlineFrequency={0.5}
            warpAmount={2}
          />
        </div>

        {/* Navbar */}
        <Navbar />

        {/* Landing Page */}
        <section id="landingPage">
          <LandingPage />
        </section>

        {/* Running text divider */}
        <div className="w-full py-5 my-5">
          <ScrollVelocity
            texts={["FULL STACK DEVELOPER", "TECH & DESIGN ENTHUSIAST"]}
            className="lg:text-8xl text-6xl text text-[#333333]"
          />
        </div>

        {/* About */}
        <section id="about" className="mt-[250px]">
          <About />
        </section>

        {/* Projects */}
        <div id="projects" className="relative">
          <Projects />
        </div>

        {/* Contacts */}
        <section id="contact">
          <Contacts />
        </section>
      </div>
    </>
  );
}
