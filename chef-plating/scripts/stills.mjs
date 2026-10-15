// Bundle once, render many stills: node scripts/stills.mjs out/dir 1 4.5 8 ...
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [outDir, ...times] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src3d/index.ts') });
const browserExecutable = process.env.REMOTION_BROWSER;
const chromiumOptions = { gl: 'swangle' };
const composition = await selectComposition({ serveUrl, id: 'ChefPlating3D', browserExecutable, chromiumOptions });
for (const t of times) {
  const frame = Math.round(parseFloat(t) * 24);
  const output = path.join(outDir, `t${t}.jpg`);
  await renderStill({ serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 85, browserExecutable, chromiumOptions, scale: 0.5 });
  console.log('rendered', output);
}
