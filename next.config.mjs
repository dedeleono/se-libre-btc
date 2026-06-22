/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "d32rxrm634otla.cloudfront.net",
      },
    ],
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  output: 'standalone',
  // The certificate OG image route reads font + logo files from disk at runtime
  // via readFile(process.cwd()/...). With output:'standalone' (and on Vercel's
  // serverless functions) these non-imported files are NOT bundled unless we
  // trace them explicitly. assets/fonts/** in particular is dropped, which makes
  // ImageResponse throw ENOENT -> 500 text/plain (downloads as image.txt, broken
  // preview). Trace the files this route depends on into its output bundle.
  outputFileTracingIncludes: {
    "/api/certificates/[id]/image": [
      "./assets/fonts/**",
      "./assets/certs/**",
    ],
  },
  // Stable in Next 15 (was experimental.serverComponentsExternalPackages).
  serverExternalPackages: ["@better-auth/kysely-adapter"],
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  // Fix for Lexical in Next.js
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
