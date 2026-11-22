import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // shortcut: this PC's LAN addresses so a phone on the same network can open the dev server; update if the router hands out new ones.
  // plus temporary Cloudflare quick tunnels for viewing the dev server from a phone off-network
  allowedDevOrigins: ["192.168.8.132", "172.15.7.248", "*.trycloudflare.com"],
  // shortcut: lets forms (server actions) work through a dev tunnel; drop once the site runs on its real domain.
  experimental: { serverActions: { allowedOrigins: ["*.trycloudflare.com"] } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
