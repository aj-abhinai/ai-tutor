import type { NextConfig } from "next";

const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const firebaseAuthOrigin = firebaseAuthDomain ? `https://${firebaseAuthDomain}` : null;
const firebaseAppOrigin =
  firebaseAuthDomain && firebaseAuthDomain.endsWith(".firebaseapp.com")
    ? `https://${firebaseAuthDomain.replace(".firebaseapp.com", ".web.app")}`
    : null;

function buildSourceList(values: Array<string | null>): string {
  return values.filter(Boolean).join(" ");
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  `script-src ${buildSourceList([
    "'self'",
    "'unsafe-inline'",
    process.env.NODE_ENV === "development" ? "'unsafe-eval'" : null,
    "https://www.gstatic.com",
  ])}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${buildSourceList([
    "'self'",
    "data:",
    "blob:",
    "https://lh3.googleusercontent.com",
  ])}`,
  "font-src 'self' data:",
  `connect-src ${buildSourceList([
    "'self'",
    process.env.NODE_ENV === "development" ? "ws:" : null,
    process.env.NODE_ENV === "development" ? "wss:" : null,
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firestore.googleapis.com",
    "https://firebaseinstallations.googleapis.com",
    "https://www.googleapis.com",
    "https://www.google.com",
    "https://accounts.google.com",
    firebaseAuthOrigin,
  ])}`,
  `frame-src ${buildSourceList([
    "'self'",
    "https://accounts.google.com",
    "https://www.google.com",
    "https://*.google.com",
    firebaseAuthOrigin,
    firebaseAppOrigin,
  ])}`,
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
