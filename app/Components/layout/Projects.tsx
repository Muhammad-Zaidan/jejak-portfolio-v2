"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import ScrollReveal from "../Fragments/ScrollReveal/ScrollReveal";
import CountUp from "../Fragments/CountUp/CountUp";
import AnimatedContent from "../Fragments/AnimatedContent/AnimatedContent";

const ProjectShowcase = () => {
  const projects = [
    {
      id: 1,
      title: "FinTech Platform",
      description:
        "Revolutionary financial technology platform with AI-driven insights, seamless user experience, and enterprise-grade security features.",
      image: "https://picsum.photos/1920/1080?random=1",
      gradient: "from-blue-900/30 via-blue-800/60 to-blue-900/30",
    },
    {
      id: 2,
      title: "Smart Office Hub",
      description:
        "Modern workspace management system integrating IoT devices, meeting room booking, and employee productivity analytics in one unified platform.",
      image: "https://picsum.photos/1920/1080?random=2",
      gradient: "from-red-900/30 via-red-800/60 to-red-900/30",
    },
    {
      id: 3,
      title: "E-Commerce Suite",
      description:
        "Complete e-commerce solution featuring advanced inventory management, multi-payment gateway integration, real-time sales analytics.",
      image: "https://picsum.photos/1920/1080?random=3",
      gradient: "from-green-900/30 via-green-800/60 to-green-900/30",
    },
    {
      id: 4,
      title: "AI Analytics Dashboard",
      description:
        "Intelligent business analytics platform powered by machine learning algorithms for predictive insights and automated reporting systems.",
      image: "https://picsum.photos/1920/1080?random=4",
      gradient: "from-orange-900/30 via-orange-800/60 to-orange-900/30",
    },
    {
      id: 5,
      title: "Mobile Banking App",
      description:
        "Secure and intuitive mobile banking application with biometric authentication and real-time transaction monitoring.",
      image: "https://picsum.photos/1920/1080?random=5",
      gradient: "from-purple-900/30 via-purple-800/60 to-purple-900/30",
    },
    {
      id: 6,
      title: "Healthcare Portal",
      description:
        "Comprehensive healthcare management system connecting patients, doctors, and medical facilities with telemedicine capabilities.",
      image: "https://picsum.photos/1920/1080?random=6",
      gradient: "from-teal-900/30 via-teal-800/60 to-teal-900/30",
    },
  ];

  return (
    <section className="relative w-full bg-white text-[#0A0A0A] z-30">
      <div className="grid grid-cols-1 md:grid-cols-2 w-full min-h-screen">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>
    </section>
  );
};

const ProjectCard = ({ project, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative h-[60vh] md:h-[50vh] overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${(index + 1) * 0.1}s`,
      }}
    >
      {/* Background Image with Hover Effects */}
      <div
        className={`
          absolute inset-0 bg-cover bg-center bg-no-repeat
          transition-all duration-700 ease-out
          ${isHovered ? "scale-110 rotate-2" : "scale-100 rotate-0"}
        `}
        style={{
          backgroundImage: `url(${project.image})`,
        }}
      />

      {/* Overlay */}
      <div
        className={`
          absolute inset-0 transition-all duration-600 ease-out
          ${isHovered ? "bg-[#0A0A0A]/70" : "bg-transparent"}
        `}
      />

      {/* Title - Top Left */}
      <div className="absolute top-12 left-12">
        <h2
          className={`
            text-4xl font-bold text-white tracking-tight uppercase
            drop-shadow-[2px_2px_8px_rgba(0,0,0,0.8)]
            transition-all duration-600 ease-out
            ${
              isHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-5"
            }
          `}
        >
          {project.title}
        </h2>
      </div>

      {/* Description - Bottom Right */}
      <div className="absolute bottom-12 right-12 text-right">
        <p
          className={`
            text-base text-white/90 leading-relaxed max-w-md font-light
            drop-shadow-[1px_1px_4px_rgba(0,0,0,0.8)]
            transition-all duration-600 ease-out
            ${
              isHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-5"
            }
          `}
        >
          {project.description}
        </p>
      </div>

      {/* Loading Animation */}
      <style jsx>{`
        .group {
          animation: slideInUp 0.8s ease-out backwards;
        }

        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(60px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const Projects = () => {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);

    ScrollTrigger.create({
      trigger: ".pinned",
      start: "top top",
      endTrigger: ".whitespace",
      end: "bottom top",
      pin: true,
      pinSpacing: false,
    });

    ScrollTrigger.create({
      trigger: ".header-info",
      start: "top top",
      endTrigger: ".whitespace",
      end: "bottom top",
      pin: true,
      pinSpacing: false,
    });

    ScrollTrigger.create({
      trigger: ".pinned",
      start: "top top",
      endTrigger: ".header-info",
      end: "bottom bottom",
      onUpdate: (self) => {
        const rotation = self.progress * 360;
        gsap.to(".revealer", { rotation });
      },
    });

    ScrollTrigger.create({
      trigger: ".pinned",
      start: "top top",
      endTrigger: ".header-info",
      end: "bottom bottom",
      onUpdate: (self) => {
        const progress = self.progress;
        const clipPath = `polygon(
          ${45 - 45 * progress}% 0%,
          ${55 + 45 * progress}% 0%,
          ${55 + 45 * progress}% 100%,
          ${45 - 45 * progress}% 100%
        )`;
        gsap.to(".revealer-1, .revealer-2", {
          clipPath,
          ease: "none",
          duration: 0,
        });
      },
    });

    ScrollTrigger.create({
      trigger: ".header-info",
      start: "top top",
      end: "bottom 50%",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const left = 35 + 15 * progress;
        gsap.to(".revealer", {
          left: `${left}%`,
          ease: "none",
          duration: 0,
        });
      },
    });

    ScrollTrigger.create({
      trigger: ".whitespace",
      start: "top 50%",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        const scale = 1 + 12 * self.progress;
        gsap.to(".revealer", {
          scale,
          ease: "none",
          duration: 0,
        });
      },
    });
  }, []);

  return (
    <>
      <main className="overflow-hidden bg-[#0A0A0A] text-white">
        <section className="w-full h-screen bg-cover bg-center flex items-center justify-center max-w-4xl mx-auto px-6 lg:px-0">
          <ScrollReveal
            baseOpacity={0.2}
            enableBlur={true}
            baseRotation={0}
            blurStrength={5}
            containerClassName={""}
            wordAnimationEnd={"bottom 50%"}
            textClassName="text-justify"
          >
            Hi! I'm Zaidan. I'm a Full Stack Developer who designs and builds
            end-to-end digital solutions. Transforming wild ideas using clean
            code and a seamless user experience into digital products that are
            not only functional but also meaningful.
          </ScrollReveal>
        </section>

        <section className="w-screen min-h-[150vh] bg-[#0A0A0A] text-white px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-12">
              <AnimatedContent
                distance={50}
                direction="vertical"
                reverse={false}
                duration={2}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                scale={1}
                threshold={0}
                delay={0.2}
              >
                <h1 className="text-5xl md:text-7xl uppercase font-bold">
                  Development
                </h1>
              </AnimatedContent>
              <AnimatedContent
                distance={50}
                direction="horizontal"
                reverse={false}
                duration={2}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                scale={1}
                threshold={0}
                delay={0.4}
              >
                <h1 className="text-5xl md:text-7xl uppercase font-bold text-[#FF3830]">
                  Design
                </h1>
              </AnimatedContent>
            </div>
          </div>
        </section>

        <section className="header-info flex flex-col justify-between items-center min-h-screen px-6 py-10 bg-[#0A0A0A] text-white">
          <p className="text-xl md:text-4xl font-light max-w-4xl text-[#FF3830] text-justify">
            Has developed more than{" "}
            <CountUp
              from={0}
              to={50}
              separator="."
              direction="up"
              duration={2}
              className="count-up-text text-[#FF3830] font-bold"
            />{" "}
            personal to professional websites and spend{" "}
            <CountUp
              from={0}
              to={21344}
              separator="."
              direction="up"
              duration={2}
              className="count-up-text text-[#FF3830] font-bold"
            />{" "}
            Thousands cups of coffee. My mission is simple,{" "}
            <span className="font-bold">
              create impactful work and help others achieve their goals more
              effectively.
            </span>
          </p>
        </section>

        <section className="whitespace relative w-full min-h-[300vh] bg-[#0A0A0A] -z-10"></section>

        <section className="pinned absolute top-[100vh] w-full min-h-[250vh] z-20">
          <div className="revealer absolute left-[35%] translate-x-[-50%] mt-32 w-28 h-28">
            <div
              className="revealer-1 absolute top-0 left-0 w-full h-full bg-white"
              style={{
                clipPath: "polygon(45% 0%, 55% 0%, 55% 100%, 45% 100%)",
              }}
            ></div>
            <div
              className="revealer-2 absolute top-0 left-0 w-full h-full bg-white rotate-90"
              style={{
                clipPath: "polygon(45% 0%, 55% 0%, 55% 100%, 45% 100%)",
              }}
            ></div>
          </div>
        </section>

        <section className="relative w-full min-h-screen bg-white text-[#0A0A0A] z-30 flex items-center justify-center">
          <div className="max-w-6xl w-full grid grid-cols-1 gap-16 px-6">
            {/* Headline Section - Full Width */}
            <div className="w-full">
              <h1 className="text-4xl text-center lg:text-left md:text-6xl lg:text-8xl font-bold leading-tight tracking-tight">
                Here my{" "}
                <span className="text-orange-500" style={{ color: "#FF3830" }}>
                  selected
                </span>
                <br />
                projects for you.
              </h1>
            </div>

            {/* Content Section - Split into 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
              {/* Left Column - CTA Section */}
              <div className="flex flex-col gap-4 md:text-left text-center">
                <AnimatedContent
                  distance={80}
                  direction="vertical"
                  reverse={false}
                  duration={2}
                  ease="power3.out"
                  initialOpacity={0}
                  animateOpacity
                  scale={0.8}
                  threshold={0}
                  delay={0.2}
                >
                  <a
                    href="#"
                    className="inline-block text-lg font-semibold tracking-widest uppercase transition-all duration-300 ease-in-out hover:translate-x-3 relative group"
                    style={{ color: "#FF3830" }}
                  >
                    VIEW GITHUB
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </AnimatedContent>
              </div>

              {/* Right Column - Description */}
              <div className="md:pl-10">
                <AnimatedContent
                  distance={80}
                  direction="horizontal"
                  reverse={false}
                  duration={2}
                  ease="power3.out"
                  initialOpacity={0}
                  animateOpacity
                  scale={0.8}
                  threshold={0}
                  delay={0.4}
                >
                  <p className="text-xl leading-relaxed text-gray-500 tracking-wide text-center lg:text-left">
                    believe that every idea deserves to be executed
                    wholeheartedly. On this page, you'll see how I translate
                    ideas into impactful and user-friendly digital products.
                  </p>
                </AnimatedContent>
              </div>
            </div>
          </div>
          {/* Masukan kodenya ke bagian sini */}
        </section>

        <ProjectShowcase />
      </main>
    </>
  );
};

export default Projects;
