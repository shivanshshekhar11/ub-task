import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /**
   * transpilePackages: tells Next.js to run the listed packages through its
   * SWC pipeline, enabling direct consumption of TypeScript source from the
   * @ub-task/shared-types workspace package — no separate build step needed.
   */
  transpilePackages: ['@ub-task/shared-types'],

  /**
   * turbopack.root: explicitly sets the monorepo root so Next.js doesn't
   * search for lockfiles in parent directories and emit a noisy warning.
   */
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
};

export default nextConfig;
