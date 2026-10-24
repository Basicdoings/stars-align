import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await build({
  absWorkingDir: projectRoot,
  entryPoints: [path.join(projectRoot, 'src', 'world-engine.js')],
  outfile: path.join(projectRoot, 'public', 'world-engine.js'),
  bundle: true,
  format: 'iife',
  globalName: 'StarsWorld',
  minify: true,
  sourcemap: true,
  target: ['es2022']
});
