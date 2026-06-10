/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Short URL shortcuts
      { source: '/qr',        destination: '/dashboard/qr',        permanent: true },
      { source: '/charts',    destination: '/dashboard/charts',    permanent: true },
      { source: '/forms',     destination: '/dashboard/forms',     permanent: true },
      { source: '/publisher', destination: '/dashboard/publisher', permanent: true },
      { source: '/sphinx',    destination: '/dashboard/sphinx',    permanent: true },
      { source: '/pdf',       destination: '/dashboard/pdf',       permanent: true },
      { source: '/mail',      destination: '/dashboard/mail',      permanent: true },
      { source: '/social',    destination: '/dashboard/social',    permanent: true },
      { source: '/settings',  destination: '/dashboard/settings',  permanent: true },
      // Backward compat — old /dashboard/tools/* URLs
      { source: '/dashboard/tools/:tool', destination: '/dashboard/:tool', permanent: true },
    ];
  },
};

export default nextConfig;
