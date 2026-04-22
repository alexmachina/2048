---
name: new-font
description: Use quando adicionar uma nova tipografia bitmap ao 2048. Scaffolda o arquivo do font, registra em src/fonts/index.ts e garante cobertura de testes. Invocável por usuário (/new-font <nome>) e por Claude.
---

# Adicionar nova tipografia bitmap ao 2048

Segue o processo de 3 passos documentado em `CLAUDE.md` (seção "Pontos de extensão"). Todos os fonts existentes seguem o mesmo padrão — este skill formaliza.

## Constraints

- **Dimensão máxima**: `N * (width + letterSpacing) - letterSpacing ≤ cellsWide * 2`, para o label "8192" (N=4) caber no tile. Com `TILE_WIDTH = 12` (24 sub-cols em quadrant): `4 * (w + s) - s ≤ 24`. Para `letterSpacing = 1`: `w ≤ 5`. Existentes usam `w=4, s=1` (tiles 4×7) ou `w=3, s=1` (classic 3×5).
- **Height**: precisa caber em `TILE_HEIGHT * 2 - 4 = 8` sub-rows (4 de padding pros cantos arredondados). Existentes: `h=5` ou `h=7`.
- **Bitmap**: matriz `number[][]` com valores 0 ou 1, dimensões `height × width`.
- **Cobertura**: glifos obrigatórios são **0-9** (os 10 dígitos). Caracteres fora disso retornam `null` e são ignorados silenciosamente por `drawLabel`.

## Passo 1 — Criar `src/fonts/<nome>.ts`

Use `src/fonts/classic.ts` como template. Estrutura:

```typescript
import type { Bitmap, Font } from './types';

/**
 * <Nome humano> <WIDTH>×<HEIGHT> bitmap — <1 linha de estética/inspiração>.
 */
const G: Record<string, Bitmap> = {
  '0': [ /* height rows × width cols */ ],
  '1': [...],
  // ... 2-9
};

export const <NOME>_FONT: Font = {
  name: '<nome>',
  width: <W>,
  height: <H>,
  letterSpacing: 1,
  glyph(ch) {
    return G[ch] ?? null;
  },
};
```

Dica: se o font for 4×7, espelhe-se em `src/fonts/nixie.ts` (detalhes como '4' topo-aberto) ou `src/fonts/dot-matrix.ts`.

## Passo 2 — Registrar em `src/fonts/index.ts`

Três edições precisam ser feitas na mesma passagem:

1. **Import** no topo: `import { <NOME>_FONT } from './<nome>';`
2. **Union `FontName`** em `src/fonts/types.ts` (ou local se estiver lá): adicionar literal `'<nome>'`.
3. **Registry `FONTS`**: `'<nome>': <NOME>_FONT,`
4. **Array `FONT_NAMES`**: adicionar `'<nome>',`
5. **`parseFontName`**: adicionar bloco `if (v === '<nome>' || v === '<alias>') return '<nome>';`

Pode usar um alias curto e um longo (ex: `'7seg'` + `'seven-segment'`). Case-insensitive é tratado no wrapper.

## Passo 3 — Cobertura de testes

`src/fonts/fonts.test.ts` usa `describe.each` sobre **todos** os fonts — basta adicionar o nome em 2 lugares:

1. Na lista do `describe.each`: `'classic', '7seg', 'dotmatrix', 'solari', 'nixie', '<nome>'`
2. Em `EXPECTED_DIMS`: `<nome>: { width: <W>, height: <H> }`
3. Em `FONTS tem exatamente N entradas`: atualizar `toHaveLength(N)`.
4. Em `parseFontName aceita aliases`: adicionar `expect(parseFontName('<alias>')).toBe('<nome>')`.

Se o font tiver particularidade visual marcante (ex: `'4' aberto-topo` no Nixie), adicionar um `describe` dedicado com testes específicos — serve de regressão.

## Verificação

```bash
bunx tsc --noEmit           # deve sair com código 0
bun test src/fonts/         # todos os testes do describe.each passam para o novo font
bun run start --font <nome> # roda o jogo com o font novo
bun run showcase            # preview lado-a-lado de todos os fonts
```

## Delegar para subagent?

Se o bitmap que você desenhou parece OK mas quer segunda opinião visual (peso consistente, traços balanceados, legibilidade no quadrant encoding), delegue pro subagent `font-reviewer`. Ele inspeciona o bitmap e reporta inconsistências.
