import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // loga drużyn: media.api-sports.io (główne źródło) + inne hosty herbów
    remotePatterns: [
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "**" },
    ],
  },
}

export default nextConfig
