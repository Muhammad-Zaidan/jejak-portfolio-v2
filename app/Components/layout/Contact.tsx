"use client";

import { useState } from "react";
import Lanyard from "../Fragments/Lanyard/Lanyard";
import AnimatedContent from "../Fragments/AnimatedContent/AnimatedContent";

export default function Contact() {
  return (
    <div className="w-full min-h-screen bg-[#161616] overflow-hidden">
      {/* Layout 3 kolom di layar besar */}
      <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[50%_50%]">
        {/* Middle - Lanyard */}
        <div className="bg-[#0A0A0A] relative flex items-center justify-center z-[99999]">
          <Lanyard position={[0, 0, 17]} gravity={[0, -40, 0]} />
        </div>

        {/* Right - Contact Info */}
        <div className="bg-[#0A0A0A] flex flex-col relative px-12 lg:py-20 py-5">
          <div className="mb-20">
            <AnimatedContent
              distance={80}
              direction="horizontal"
              reverse={false}
              duration={2}
              ease="power3.out"
              initialOpacity={0}
              animateOpacity
              scale={1}
              threshold={0}
              delay={0.2}
            >
              <h1 className="text-white lg:text-5xl text-xl font-black leading-tight mb-1 tracking-tight uppercase">
                Start big steps from small discussions! Get in touch?
              </h1>
            </AnimatedContent>
          </div>

          <div className="space-y-4 mt-auto w-full">
            {/* Phone / Whatsapp */}
            <AnimatedContent
              distance={80}
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
              <a
                href="https://wa.me/6289652094251"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center border-b border-gray-400 pb-2 w-full text-white text-sm transition-all duration-200 hover:text-[#FF3830]"
              >
                <span className="uppercase tracking-wider flex items-center gap-2">
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#FF3830"
                    className="w-4 h-4"
                  >
                    <title>Instagram</title>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  PHN / WA 1
                </span>
                <span>+62 896 5209 4251</span>
              </a>
            </AnimatedContent>
            {/* Email */}
            <AnimatedContent
              distance={80}
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
              <a
                href="mailto:jejakzaidan@gmail.com"
                target="_blank"
                className="flex justify-between items-center border-b border-gray-400 pb-2 w-full text-white text-sm transition-all duration-200 hover:text-[#FF3830]"
              >
                <span className="uppercase tracking-wider flex items-center gap-2">
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#FF3830"
                    className="w-4 h-4"
                  >
                    <title>Instagram</title>
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                  MAIL
                </span>
                <span>jejakzaidan@gmail.com</span>
              </a>
            </AnimatedContent>
            {/* Instagram */}
            <AnimatedContent
              distance={80}
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
              <a
                href="https://instagram.com/jejak.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center border-b border-gray-400 pb-2 w-full text-white text-sm transition-all duration-200 hover:text-[#FF3830]"
              >
                <span className="uppercase tracking-wider flex items-center gap-2">
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#FF3830"
                    className="w-4 h-4"
                  >
                    <title>Instagram</title>
                    <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
                  </svg>
                  IG
                </span>
                <span>@JEJAK.CO</span>
              </a>
            </AnimatedContent>
          </div>
        </div>
      </div>
    </div>
  );
}
