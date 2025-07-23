"use client";

import Button from "../Elements/Button";
import AnimatedContent from "../Fragments/AnimatedContent/AnimatedContent";
import FallingText from "../Fragments/FallingText/FallingText";
import TextPressure from "../Fragments/TextPressure/TextPressure";
import TrueFocus from "../Fragments/TrueFocus/TrueFocus";

const About = () => {
  return (
    <>
      <div className="container">
        <div className="p-10 w-full h-full max-w-5xl mx-auto flex flex-wrap items-center">
          <div className="w-full h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4 mt-9">
              {/* Judul bagian */}
              <div className="lg:row-span-2 p-1 overflow-hidden mt-3">
                <div className="w-full">
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
                    <p className="text-4xl font-base">
                      <span className="font-bold">Zaidan</span> beautifully
                      craft an{" "}
                      <span className="font-bold text-[#FF3830]">
                        impactful
                      </span>{" "}
                      solution.
                    </p>
                  </AnimatedContent>
                </div>

                <div className="w-full flex flex-col items-start gap-2 mt-4">
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
                    delay={0.3}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src="assets/panahkanan.gif"
                        width="39"
                        height="20px"
                        alt=""
                      />
                      <p className="text-xs">
                        Cooperating with us will be your best decision.
                      </p>
                    </div>
                  </AnimatedContent>
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
                    delay={0.4}
                  >
                    <Button
                      href="https://picsum.photos/1920/1080"
                      className="mt-3"
                    >
                      Get in Touch
                    </Button>
                  </AnimatedContent>
                </div>
              </div>
              {/* Expertise */}
              <div className="p-1 overflow-hidden flex items-center justify-center">
                {/* card */}
                <div className="w-full h-full rounded-2xl bg-[#171717] flex items-center justify-center">
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
                    delay={0.5}
                  >
                    <TrueFocus
                      sentence="Full Stack Developer"
                      manualMode={false}
                      blurAmount={3.5}
                      borderColor="#FF3830"
                      pauseBetweenAnimations={1}
                    />
                  </AnimatedContent>
                </div>
              </div>
              {/* Stack */}
              <div className="flex justify-center items-center p-1 overflow-hidden lg:row-span-2 ">
                {/* card */}
                <div className="w-full h-full rounded-2xl bg-[#171717] flex flex-wrap justify-center items-center relative">
                  <h1 className="font-bold text-xl absolute text-center mt-10 text-clamp-1 opacity-40">
                    Preferred tools for turning concepts into reality.
                    <span className="block text-xs font-light text-slate-500 mt-4">
                      *Letakan cursor pada kotak
                    </span>
                  </h1>
                  <FallingText
                    text={`Vanilla-CSS Bootstrap React Javascript Next.JS PHP Laravel Codeigniter MySql Firebase`}
                    highlightWords={[
                      "React",
                      "Bootstrap",
                      "Vanilla-CSS",
                      "Javascript",
                      "Next.JS",
                      "PHP",
                      "Laravel",
                      "Codeigniter",
                      "MySql",
                      "Firebase",
                    ]}
                    trigger="hover"
                    gravity={0.56}
                    fontSize="1.1rem"
                    mouseConstraintStiffness={0.35}
                  />
                </div>
              </div>
              {/* Base */}
              <div className="flex justify-center items-center p-1 overflow-hidden">
                {/* card */}
                <div className="w-full h-full rounded-2xl bg-[#171717] flex flex-wrap justify-center items-center relative">
                  <h5 className="absolute left-1/2 -translate-x-1/2 top-3 text-[#3c3c3c]">
                    Based in
                  </h5>
                  <div
                    className="w-full mx-5 my-7"
                    style={{ position: "relative" }}
                  >
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
                      delay={0.6}
                    >
                      <TextPressure
                        text="Bandung"
                        flex={true}
                        alpha={false}
                        stroke={false}
                        width={false}
                        weight={true}
                        italic={true}
                        textColor="#ffffff"
                        strokeColor="#ff0000"
                        minFontSize={56}
                      />
                    </AnimatedContent>
                  </div>
                </div>
              </div>
              <>
                {/* Coffee
                  <div className="flex justify-center items-center p-1 overflow-hidden">
                    card
                    <div className="w-full h-full rounded-2xl bg-[#171717] flex flex-col justify-center items-center">
                      <div>
                        <CountUp
                          from={0}
                          to={190431}
                          separator=","
                          direction="up"
                          duration={3}
                          className="count-up-text text-5xl font-extrabold bg-gradient-to-b from-[#ff3b34] to-[#5f100f] bg-clip-text text-transparent"
                        />
                      </div>
                      <p className="text-sm text-center font-medium mt-3 text-[#303030]">
                        Cangkir kopi telah dihabiskan
                      </p>
                    </div>
                  </div>
                  Perkenalan singkat
                  <div className="flex justify-center items-center p-1 overflow-hidden lg:col-span-2 ">
                    card
                    <div className="w-full h-full rounded-2xl bg-[#171717] p-4">
                      <img
                        src="https://ghchart.rshah.org/Muhammad-Zaidan"
                        className="w-full h-full"
                        alt="GitHub Contribution Chart"
                      />
                    </div>
                  </div> */}
              </>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
