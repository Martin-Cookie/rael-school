/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Only local images — no remote patterns (prevents SSRF/DoS via Image Optimizer)
  },
}

module.exports = nextConfig
