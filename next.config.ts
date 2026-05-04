const nextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard/reportes',
        destination: '/dashboard/caja',
        permanent: true, // Esto es un redirect 301 (permanente)
      },
    ]
  },
}

export default nextConfig