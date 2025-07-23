"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ContactFormContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  nama: string;
  setNama: (val: string) => void;
  pesan: string;
  setPesan: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleWebEmail: (provider: "gmail" | "yahoo" | "outlook") => void;
  mailtoLink: string;
}

const ContactFormContext = createContext<ContactFormContextType | undefined>(
  undefined
);

export const ContactFormProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [pesan, setPesan] = useState("");

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const mailtoLink = `mailto:jejakzaidan@gmail.com?subject=${encodeURIComponent(
    "Pesan dari Website"
  )}&body=${encodeURIComponent(`Nama: ${nama}\n\nPesan:\n${pesan}`)}`;

  // Fungsi untuk membuka web email
  const handleWebEmail = (provider: "gmail" | "yahoo" | "outlook") => {
    if (!nama.trim() || !pesan.trim()) {
      alert("Mohon isi nama dan pesan terlebih dahulu");
      return;
    }

    const subject = encodeURIComponent("Pesan dari Website");
    const body = encodeURIComponent(`Nama: ${nama}\n\nPesan:\n${pesan}`);
    const email = "jejakzaidan@gmail.com";

    let webEmailUrl = "";

    switch (provider) {
      case "gmail":
        webEmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
        break;
      case "yahoo":
        webEmailUrl = `https://compose.mail.yahoo.com/?to=${email}&subject=${subject}&body=${body}`;
        break;
      case "outlook":
        webEmailUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${subject}&body=${body}`;
        break;
    }

    // Buka di tab baru
    window.open(webEmailUrl, "_blank");

    // Reset form
    setTimeout(() => {
      setNama("");
      setPesan("");
      close();
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Langsung arahkan ke Gmail di browser
    handleWebEmail("gmail");
  };

  return (
    <ContactFormContext.Provider
      value={{
        isOpen,
        toggle,
        close,
        nama,
        setNama,
        pesan,
        setPesan,
        handleSubmit,
        handleWebEmail,
        mailtoLink,
      }}
    >
      {children}
    </ContactFormContext.Provider>
  );
};

export const useContactForm = () => {
  const context = useContext(ContactFormContext);
  if (!context) {
    throw new Error("useContactForm must be used within a ContactFormProvider");
  }
  return context;
};
