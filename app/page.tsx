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
  return (
    <>
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
            className="text-9xl text-[#333333]"
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
