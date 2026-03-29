import nextPwa from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const withPWA = nextPwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const pwaConfig = withPWA(nextConfig);

export default withSentryConfig(
  pwaConfig,
  {
    hideSourceMaps: true,
    disableLogger: true,
  },
  {
    hideSourceMaps: true,
    disableLogger: true,
  },
);
