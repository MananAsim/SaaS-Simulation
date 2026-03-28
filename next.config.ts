import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
export default nextConfig;
