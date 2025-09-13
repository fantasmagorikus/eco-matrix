import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Silence lockfile root inference warnings when running in monorepos
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
