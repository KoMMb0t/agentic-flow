/**
 * Browser Build Configuration for AgentDB
 * ADR-071 Phase 4: Browser Deployment
 *
 * Creates optimized browser bundle with WASM support:
 * - graph-transformer-wasm for graph operations
 * - attention-wasm for Flash Attention v2
 * - RVF format support
 * - Cloudflare Workers compatibility
 * - Deno Deploy compatibility
 */

import * as esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

/**
 * Browser build configuration
 */
const browserConfig = {
  entryPoints: [resolve(rootDir, 'src/index.ts')],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: ['es2020'],
  outfile: resolve(rootDir, 'dist/browser/agentdb.browser.js'),
  sourcemap: true,
  minify: true,
  treeShaking: true,
  external: [
    // Node.js-specific modules (excluded from browser build)
    'better-sqlite3',
    'fs',
    'path',
    'crypto',
    'os',
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.BROWSER': JSON.stringify('true'),
    global: 'globalThis',
  },
  alias: {
    // Use WASM versions for browser
    '@ruvector/attention': 'ruvector-attention-wasm',
    '@ruvector/graph-transformer': 'ruvector-graph-transformer-wasm',
  },
  loader: {
    '.wasm': 'file',
    '.rvf': 'file',
  },
  plugins: [
    {
      name: 'wasm-loader',
      setup(build) {
        // Handle .wasm files
        build.onResolve({ filter: /\.wasm$/ }, (args) => {
          return {
            path: resolve(args.resolveDir, args.path),
            namespace: 'wasm-stub',
          };
        });

        build.onLoad({ filter: /.*/, namespace: 'wasm-stub' }, async (args) => {
          return {
            contents: `export default "${args.path}"`,
            loader: 'js',
          };
        });
      },
    },
  ],
  metafile: true,
};

/**
 * Cloudflare Workers build (optimized for edge runtime)
 */
const workersConfig = {
  ...browserConfig,
  entryPoints: [resolve(rootDir, 'src/index.ts')],
  outfile: resolve(rootDir, 'dist/workers/agentdb.workers.js'),
  platform: 'browser', // Workers use V8
  conditions: ['worker', 'browser'],
  define: {
    ...browserConfig.define,
    'process.env.CLOUDFLARE_WORKERS': JSON.stringify('true'),
  },
};

/**
 * Deno Deploy build
 */
const denoConfig = {
  ...browserConfig,
  entryPoints: [resolve(rootDir, 'src/index.ts')],
  outfile: resolve(rootDir, 'dist/deno/agentdb.deno.js'),
  format: 'esm',
  platform: 'neutral', // Deno supports both browser and Node APIs
  conditions: ['deno', 'browser'],
  define: {
    ...browserConfig.define,
    'process.env.DENO': JSON.stringify('true'),
  },
};

/**
 * Build all targets
 */
async function buildAll() {
  console.log('🏗️  Building AgentDB for browser environments...\n');

  // 1. Browser build
  console.log('📦 Building browser bundle...');
  const browserResult = await esbuild.build(browserConfig);
  console.log(`✅ Browser bundle: ${(browserResult.metafile.outputs['dist/browser/agentdb.browser.js']?.bytes || 0) / 1024}KB\n`);

  // 2. Cloudflare Workers build
  console.log('⚡ Building Cloudflare Workers bundle...');
  const workersResult = await esbuild.build(workersConfig);
  console.log(`✅ Workers bundle: ${(workersResult.metafile.outputs['dist/workers/agentdb.workers.js']?.bytes || 0) / 1024}KB\n`);

  // 3. Deno Deploy build
  console.log('🦕 Building Deno Deploy bundle...');
  const denoResult = await esbuild.build(denoConfig);
  console.log(`✅ Deno bundle: ${(denoResult.metafile.outputs['dist/deno/agentdb.deno.js']?.bytes || 0) / 1024}KB\n`);

  // Generate bundle analysis
  const analysis = {
    browser: analyzeBundleSize(browserResult.metafile),
    workers: analyzeBundleSize(workersResult.metafile),
    deno: analyzeBundleSize(denoResult.metafile),
  };

  writeFileSync(
    resolve(rootDir, 'dist/bundle-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );

  console.log('📊 Bundle analysis saved to dist/bundle-analysis.json');
  console.log('\n✅ All builds complete!');
}

/**
 * Analyze bundle size and composition
 */
function analyzeBundleSize(metafile) {
  const outputs = Object.entries(metafile.outputs);
  const totalSize = outputs.reduce((sum, [, output]) => sum + (output.bytes || 0), 0);

  const imports = Object.entries(metafile.inputs).map(([path, input]) => ({
    path,
    bytes: input.bytes,
  }));

  return {
    totalBytes: totalSize,
    totalKB: totalSize / 1024,
    totalMB: totalSize / 1024 / 1024,
    largestImports: imports
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10)
      .map((i) => ({
        path: i.path,
        kb: (i.bytes / 1024).toFixed(2),
      })),
  };
}

// Run builds
buildAll().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
