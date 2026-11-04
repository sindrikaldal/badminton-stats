import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev badge sits exactly where the bottom tab bar does.
  devIndicators: false,
  experimental: {
    // How long a prefetched tab may be shown from memory (BottomNav). Long on
    // purpose: LiveRefresh checks a page the moment it arrives and refreshes
    // it if the data has moved on, and any change re-prefetches every tab, so
    // this only decides how often a tap still has to wait on the server.
    staleTimes: { static: 1800 },
  },
};

export default nextConfig;
