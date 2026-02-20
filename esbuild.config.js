import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');
const isProd = !isWatch;

const config = {
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/demo-inspector.js',
  format: 'iife',
  target: 'es2020',
  minify: isProd,
  sourcemap: !isProd,
};

if (isWatch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(config);
  const { statSync } = await import('fs');
  const stats = statSync('dist/demo-inspector.js');
  console.log(`Built dist/demo-inspector.js (${(stats.size / 1024).toFixed(1)} KB)`);
}
