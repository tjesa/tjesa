/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/qr',        destination: '/dashboard/tools/qr',        permanent: true },
      { source: '/charts',    destination: '/dashboard/tools/charts',    permanent: true },
      { source: '/forms',     destination: '/dashboard/tools/forms',     permanent: true },
      { source: '/publisher', destination: '/dashboard/tools/publisher', permanent: true },
      { source: '/sphinx',    destination: '/dashboard/tools/sphinx',    permanent: true },
      { source: '/pdf',       destination: '/dashboard/tools/pdf',       permanent: true },
      { source: '/mail',      destination: '/dashboard/tools/mail',      permanent: true },
      { source: '/social',    destination: '/dashboard/tools/social',    permanent: true },
      { source: '/settings',  destination: '/dashboard/settings',        permanent: true },
    ];
  },
};

export default nextConfig;
