/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export disabled - we need server mode for API routes
  // output: 'export',  // <-- COMMENTED OUT
  // trailingSlash: true,  // <-- COMMENTED OUT
  
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  },
}

module.exports = nextConfig
