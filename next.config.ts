import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
  serverExternalPackages: ["oracledb", "oci-common", "oci-generativeaiinference"]
};

export default nextConfig;
