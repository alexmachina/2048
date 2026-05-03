#!/usr/bin/env bun
// Build standalone do 2048: gera dist/2048 (Mach-O / ELF dependendo do host).
//
// `bun build --compile` não consegue resolver `react-devtools-core` porque o
// Ink importa esse pacote no top-level de `node_modules/ink/build/devtools.js`,
// mesmo sendo carregado só dentro de `if (process.env.DEV === 'true')`. O
// `--define` não ajuda porque o renaming interno do bundler troca `process`
// por `process3`/`process11`, então o substituinte não bate. A solução é um
// plugin `onResolve` que substitui `react-devtools-core` por um stub vazio.

import type { BunPlugin } from 'bun';

const stubReactDevtools: BunPlugin = {
  name: 'stub-react-devtools-core',
  setup(build) {
    build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
      path: 'react-devtools-core',
      namespace: 'stub',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'export default { connectToDevTools() {} };',
      loader: 'js',
    }));
  },
};

const result = await Bun.build({
  entrypoints: ['src/cli.tsx'],
  target: 'bun',
  compile: { outfile: 'dist/2048' },
  plugins: [stubReactDevtools],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
