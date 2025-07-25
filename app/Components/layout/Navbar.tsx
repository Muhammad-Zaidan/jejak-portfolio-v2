"use client";

import { useEffect, useState } from "react";
import ThemeSwitcher from "../Fragments/ThemeSwitcher/ThemeSwitcher";
import { AnimatePresence, motion } from "framer-motion";

// Button component (assumed to be available in your project)
type ButtonProps = {
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  [key: string]: any; // untuk props tambahan seperti `id`, `target`, dll.
};

const Button = ({
  href,
  className = "",
  children,
  onClick,
  ...props
}: ButtonProps) => {
  if (href) {
    return (
      <a
        href={href}
        className={`inline-block px-6 py-3 bg-[#FF3830] hover:bg-[#e13a29] text-white font-semibold rounded transition-colors duration-200 ${className}`}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-block px-6 py-3 bg-[#FF3830] hover:bg-[#e13a29] text-white font-semibold rounded transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [pesan, setPesan] = useState("");

  // Handle menu open/close effect
  useEffect(() => {
    if (isMenuOpen || isContactFormOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMenuOpen, isContactFormOpen]);

  // Handle contact form functions
  const toggleContactForm = () => {
    setIsContactFormOpen(!isContactFormOpen);
  };

  const closeContactForm = () => {
    setIsContactFormOpen(false);
  };

  const handleContactSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const to = "jejakzaidan@gmail.com";
    const subject = encodeURIComponent("Pesan dari Website");
    const body = encodeURIComponent(`Nama: ${nama}\n\nPesan:\n${pesan}`);
    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;

    window.open(gmailLink, "_blank");

    setTimeout(() => {
      setNama("");
      setPesan("");
      closeContactForm();
    }, 500);
  };

  // Handle escape key for both menu and contact form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isContactFormOpen) {
          closeContactForm();
        } else if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, isContactFormOpen]);

  const mailtoLink = `mailto:your-email@example.com?subject=${encodeURIComponent(
    "Pesan dari Website"
  )}&body=${encodeURIComponent(`Nama: ${nama}\n\nPesan:\n${pesan}`)}`;

  return (
    <>
      {/* Top Navbar */}
      <div className="absolute min-w-sm h-22 flex items-center w-full z-40">
        <div className="w-full mx-7">
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <div className="text-sm font-medium">
              <a href="">EN</a>
            </div>
          </div>
        </div>
        {/* Watermark */}
        <div className="absolute top-4 right-4">
          <button onClick={() => setIsMenuOpen(true)}>
            <img
              src="assets/watermark.webp"
              alt="WM"
              className="fixed top-4 right-4 w-20 z-50"
            />
          </button>
        </div>
      </div>

      {/* Fullscreen Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black text-white z-50 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-6 right-6 text-white text-4xl z-50"
            >
              &times;
            </button>

            {/* Navigation Items */}
            <div className="lg:text-8xl md:text-6xl font-bold uppercase space-y-2">
              <div>
                <a
                  href="#landingPage"
                  className="hover:text-neutral-400 transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                  <sup className="text-[#FF3830] lg:text-4xl text-sm align-super">
                    ©
                  </sup>
                </a>{" "}
                /{" "}
                <a
                  href="#about"
                  className="hover:text-neutral-400 transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About Us
                  <sup className="text-[#FF3830] lg:text-4xl text-sm align-super">
                    ©
                  </sup>
                </a>
              </div>
              <div>
                <a
                  href="#projects"
                  className="hover:text-neutral-400 transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Projects
                  <sup className="text-[#FF3830] lg:text-4xl text-sm align-super">
                    ©
                  </sup>
                </a>
              </div>
              <div>
                <a
                  href="#contact"
                  className="hover:text-neutral-400 transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                  <sup className="text-[#FF3830] lg:text-4xl text-sm align-super">
                    ©
                  </sup>
                </a>
              </div>
              <div>
                <a
                  href="#journal"
                  className="hover:text-neutral-400 transition duration-300"
                  onClick={toggleContactForm}
                >
                  Get-In_Touch
                  <sup className="text-[#FF3830] lg:text-4xl text-sm align-super">
                    ©
                  </sup>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Form Backdrop */}
      {isContactFormOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[1999] transition-opacity duration-400"
          onClick={closeContactForm}
        />
      )}

      {/* Contact Form Clipboard Container */}
      <div
        id="clipboardContainer"
        className={`fixed top-0 w-[360px] h-full z-[2000] transition-all duration-400 cubic-bezier(0.25, 0.46, 0.45, 0.94) ${
          isContactFormOpen ? "left-0" : "-left-[360px]"
        }`}
      >
        <div className="bg-[#1a1a1a] w-full h-full relative shadow-[2px_0_15px_rgba(0,0,0,0.7)]">
          {/* Contact Tab Button */}
          <button
            onClick={toggleContactForm}
            className="absolute -right-[45px] top-1/2 -translate-y-1/2 bg-[#666] hover:bg-[#777] text-white border-none p-0 cursor-pointer text-[11px] font-bold tracking-wide rounded-r-lg z-[2001] transition-colors duration-300 w-[45px] h-[90px] flex items-center justify-center"
            style={{ writingMode: "vertical-lr", textOrientation: "mixed" }}
          >
            CONTACT
          </button>

          {/* Close Button */}
          <button
            onClick={closeContactForm}
            className="absolute top-5 right-5 bg-none border-none text-gray-400 hover:text-white text-lg cursor-pointer w-5 h-5 flex items-center justify-center transition-colors duration-200 font-normal leading-none"
          >
            ×
          </button>

          {/* Form Content */}
          <div className="pt-[60px] px-10 pb-10 h-full flex flex-col">
            <div className="flex flex-col h-full">
              <div className="mb-8 flex-shrink-0">
                <label
                  htmlFor="nama"
                  className="block mb-4 text-white text-[15px] font-normal"
                >
                  Nama
                </label>
                <input
                  type="text"
                  id="nama"
                  name="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  onFocus={(e) => (e.target.placeholder = "")}
                  onBlur={(e) => (e.target.placeholder = "Masukkan nama Anda")}
                  className="w-full bg-transparent border-0 border-b border-gray-600 px-0 py-2 pb-2 text-gray-300 focus:text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-all duration-300 text-sm leading-[1.4]"
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div className="mb-8 flex-shrink-0">
                <label
                  htmlFor="pesan"
                  className="block mb-4 text-white text-[15px] font-normal"
                >
                  Pesan
                </label>
                <textarea
                  id="pesan"
                  name="pesan"
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  onFocus={(e) => (e.target.placeholder = "")}
                  onBlur={(e) => (e.target.placeholder = "Masukkan pesan Anda")}
                  className="w-full bg-transparent border-0 border-b border-gray-600 px-0 py-2 pb-2 text-gray-300 focus:text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-all duration-300 resize-none min-h-[60px] text-sm leading-[1.4]"
                  placeholder="Masukkan pesan Anda"
                />
              </div>

              <button
                type="button"
                onClick={handleContactSubmit}
                className="inline-block px-6 py-2 rounded-full
    bg-gradient-to-r from-[#FF3830] via-[#a21c1a] to-[#6d1311]
    hover:from-[#e13a29] hover:via-[#861714] hover:to-[#540f0d]
    text-white font-semibold text-sm
    shadow-md hover:shadow-lg
    transition-all duration-200 ease-in-out
    hover:scale-[1.02]
    cursor-pointer self-start mt-2"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
