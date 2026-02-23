/** @type {import('next').NextConfig} */
const nextConfig = {
  // COMMENT OUT or REMOVE the export line
  // output: 'export',
  // trailingSlash: true, // Also comment this out
  
  images: {
    unoptimized: true // Keep this for image optimization
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  },
}

module.exports = nextConfig