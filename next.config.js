/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Headers de seguridad
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevenir clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevenir MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Política de referrer
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // X-XSS-Protection intentionally omitted - deprecated in modern browsers
          // and can introduce vulnerabilities. CSP replaces it.
          // Content Security Policy
          // NOTE: 'unsafe-inline' is required for:
          // - Next.js hydration scripts
          // - HeroUI inline styles
          // - Framer Motion animations
          // 'unsafe-eval' is required ONLY in development for Next.js React Refresh (hot reload).
          // XSS protection is enforced via:
          // - Input sanitization (lib/sanitize.ts)
          // - Zod validation with anti-XSS regex
          // - HTTP-only cookies
          // - Strict output escaping (React auto-escapes)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              process.env.NODE_ENV === "development"
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'", // No eval in production
              "style-src 'self' 'unsafe-inline'", // Required for CSS-in-JS
              "worker-src 'self' blob:", // IndexedDB sync workers
              "img-src 'self' data: https:", // Allow external images (user uploads)
              "font-src 'self'",
              "connect-src 'self'", // API calls only to same origin
              "media-src 'self'",
              "object-src 'none'", // Block Flash/Java
              "base-uri 'self'", // Prevent base tag injection
              "form-action 'self'", // Forms only submit to same origin
              "frame-ancestors 'none'", // No iframes (same as X-Frame-Options: DENY)
              ...(process.env.NODE_ENV === "production"
                ? ["upgrade-insecure-requests"]
                : []),
            ].join("; "),
          },
          // Permissions Policy
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=()",
          },
          // HSTS (solo en producción)
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },

  // Configuración de seguridad adicional
  experimental: {
    // Deshabilitar telemetría
  },

  // Configuración de imágenes
  images: {
    domains: [],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Configuración de compresión
  compress: true,

  // Configuración de powered by
  poweredByHeader: false,

  // Configuración de trailing slash
  trailingSlash: false,

  // Configuración de redirecciones
  async redirects() {
    return [
      // Redirigir HTTP a HTTPS en producción
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/:path*",
              has: [
                {
                  type: "header",
                  key: "x-forwarded-proto",
                  value: "http",
                },
              ],
              destination: "https://:host/:path*",
              permanent: true,
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
