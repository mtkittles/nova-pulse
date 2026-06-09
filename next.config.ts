import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // loga drużyn pochodzą z różnych hostów (API-Football itp.)
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
}

export default nextConfig
