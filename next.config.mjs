/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com", "drive.google.com"],
  },
  experimental: {
    serverComponentsExternalPackages: ["googleapis"],
  },
};

export default nextConfig;
