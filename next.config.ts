
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos', // Keep if used for placeholders
        port: '',
        pathname: '/**',
      },
      // Add other image source hostnames if necessary
    ],
  },
  async redirects() {
    return [
      // Redirect root to signin page initially.
      // Authentication context will handle redirection after login.
      // {
      //   source: '/',
      //   destination: '/signin',
      //   permanent: false, // Temporary redirect, as auth state might change
      // },
       // Let the AuthProvider handle the root redirect logic based on auth state
    ]
  },
};

export default nextConfig;
