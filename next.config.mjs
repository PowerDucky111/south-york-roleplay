
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { dirname } from "path";
import { fileURLToPath } from "url";

initOpenNextCloudflareForDev();

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
