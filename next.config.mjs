/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lxncolsjgikglpebxtce.supabase.co",
      },
    ],
  },
};

export default nextConfig;
