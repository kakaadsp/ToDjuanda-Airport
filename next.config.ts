import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const scriptPolicy = process.env.NODE_ENV === "development" ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";
const localDevOrigins = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses ?? [])
  .filter((address) => address.family === "IPv4" && !address.internal)
  .map((address) => address.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", ...localDevOrigins],
  poweredByHeader: false, // Menyembunyikan header 'X-Powered-By: Next.js' agar tidak memberi info versi server ke penyerang
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Content-Security-Policy", value: `default-src 'self'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline'; ${scriptPolicy}; connect-src 'self' https:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` },
    ] }];
  },
};

export default nextConfig;
