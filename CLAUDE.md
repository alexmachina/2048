# CLAUDE.md

Contexto para o Claude Code trabalhar neste repositório.

## Projeto

2048 em terminal, escrito em TypeScript, executado por Bun, renderizado com
Ink 5. A lógica de jogo é pura (sem efeitos colaterais) e separada da UI para
poder ser testada sem subir um TTY. Números são desenhados como bitmap via
caracteres Unicode sub-célula (default: quadrant blocks 2×2/cell), não
texto — detalhes em [`docs/sub-cell-rendering.md`](docs/sub-cell-rendering.md).
Existem 5 tipografias selecionáveis via `--font`: `classic` (default, 3×5),
`7seg`, `dotmatrix`, `solari`, `nixie` (ver `src/fonts/`). Todos os
dígitos renderizam em bold (`<Text bold>`), propagado de `TileStyle.bold`
da palette.

## Comandos

```bash
bun install              # instalar dependências
bun run start            # rodar o jogo (precisa de TTY real)
bun run src/cli.tsx      # equivalente

bun test                 # rodar testes (47 no momento)
bunx tsc --noEmit        # checagem de tipos (autoritativo — diagnostics do
                         #   LSP podem ficar stale; confie no exit code do tsc)
```

**Slash commands** (em `.claude/commands/`):
- `/check` — roda `bun test` + `bunx tsc --noEmit` em paralelo, reporta o estado.
- `/preview` — captura um frame do jogo em modo não-TTY para inspeção visual.

## Estrutura `.claude/`

```
.claude/
├── settings.json           — permissões do projeto (committed)
├── settings.local.json     — overrides por-dev (gitignored)
└── commands/
    ├── check.md            — /check
    └── preview.md          — /preview
```

`settings.json` pré-aprova as operações do loop de dev (`bun test`, `bun run`,
`bunx tsc`) para reduzir prompts de permissão. Ajustes específicos por
desenvolvedor vão em `settings.local.json`, que é gitignored.

## Arquitetura

```
src/
├── engine.ts         — regras puras. Estado e metadata de animação
│                       (slidFrom, mergedFrom, isNew) vivem aqui, mas não há
│                       nenhum I/O.
├── animations.ts     — máquina de estados sliding → merging → spawning → idle.
│                       renderFrame(anim) devolve um DisplayTile[] por frame.
├── palette.ts        — tipos Palette/ColorScheme, paletas ansi e truecolor,
│                       PaletteContext (React Context) + usePalette().
├── fonts/            — tipografias dos números nos tiles.
│   ├── types.ts      — Font, FontName, Bitmap.
│   ├── classic.ts    — bitmap 3×5 original (default).
│   ├── seven-segment.ts, dot-matrix.ts, solari.ts, nixie.ts — bitmaps 4×7.
│   └── index.ts      — FONTS registry, getFont, parseFontName, FontContext.
├── args.ts           — parser de argumentos da CLI (--colors, --font, --help).
├── canvas.ts         — canvas de sub-pixels + encoders quadrant/braille.
│                       labelOnTile(label, w, h, font) aplica decorateTile do
│                       Solari após desenhar os dígitos.
├── cli.tsx           — entry Ink. Parseia argv, injeta PaletteContext.
│                       useInput dispara move(); useEffect avança frames via
│                       setTimeout(frameDurationMs(anim)).
└── components/
    ├── Board.tsx     — grid 4×4; resolve colisões de célula preferindo tiles
    │                   com pulse.
    ├── Tile.tsx      — célula de TILE_WIDTH × TILE_HEIGHT (hoje 10×5) montada
    │                   como <Text> empilhado (veja ressalva de Ink abaixo).
    └── Hud.tsx       — score, best, banners de vitória/derrota.

docs/
└── sub-cell-rendering.md   — deep-dive de como os números são desenhados.
```

## Convenções

### Testes
- `bun test` é a ferramenta. Arquivos de teste ficam ao lado do código
  (`engine.test.ts`, `animations.test.ts`, `canvas.test.ts`).
- Testes novos devem ser **determinísticos**: o engine aceita `rng: () => number`
  injetável, então nunca use `Math.random` nos testes — passe `() => 0` ou
  um LCG seedado (há um helper `seededRng` em `engine.test.ts`).
- TDD: escreva o teste antes da implementação. Não é negociável para mudanças
  no engine ou no canvas.

### TypeScript
- `strict: true` em `tsconfig.json`.
- `tsc --noEmit` precisa sair com código 0 antes de qualquer commit.
- O sistema de diagnostics do LSP ocasionalmente reporta erros stale para
  `engine.test.ts` depois de edits cruzados; o veredito final é o `tsc`.

### Ink 5.2.1 — ressalva importante
`<Box>` **não** aceita `backgroundColor` nesta versão — só `<Text>`.
Qualquer célula preenchida é feita empilhando linhas de `<Text>` com
`backgroundColor`. Não tente passar `backgroundColor` para `<Box>`, o tipo
recusa em silêncio via o `LiteralUnion` e o diagnostic fica inconsistente.

Se subir para Ink 7, reavaliar — várias APIs mudam.

### Rendering dos números (sub-célula)

Os dígitos de cada tile são desenhados como **bitmap pixelado** via caracteres
Unicode que codificam múltiplos sub-pixels por célula. Isso existe para
contornar a assimetria de centralização da grade de células — texto ASCII
comum centraliza com precisão de 1 célula, o bitmap chega a ~0.25 célula.

- **Quadrant** (`U+2580..U+259F`, **padrão**): 2×2 sub-pixels por célula.
  Visual chunky, tile sólido com número em relevo. Os 4 fonts 4×7 cabem
  confortavelmente (7 sub-rows em 10-sub-row tile → padding 1 top / 2 bottom).
- **Braille** (`U+2800..U+28FF`): 2×4 sub-pixels por célula. Visual pontilhado
  estilo LCD. Override via quinto argumento de `labelOnTile(..., 'braille')`.
  Mantido como alternativa, mas ruim quando a legibilidade importa em tiles
  coloridos — escolhido brevemente e revertido após feedback.

Pipeline: `src/fonts/{nome}.ts` (bitmap por dígito) → `src/canvas.ts` pinta
em grid 0/1 → `decorateTile` opcional aplica ornamento de tile (costura do
Solari) → `canvasToBraille` / `canvasToQuadrant` serializa em strings
Unicode. Ver [`docs/sub-cell-rendering.md`](docs/sub-cell-rendering.md).

**Se precisar adicionar caracteres** (ex: `+` para animação de score) o
bitmap vai no map `G` do font correspondente em `src/fonts/`. Caracteres
desconhecidos são ignorados em silêncio por `drawLabel`. Para cobrir os 4
fonts de uma vez, adicione a entrada nos 4 arquivos.

### Line-height do terminal (dica do usuário)

Blocos verticais adjacentes (como `▀` seguido de `▄`) só conectam "perfeitamente"
se o terminal estiver com **line-height 1.0**. Em terminais com line-height >
1.0 aparece um gap horizontal entre cell-rows do tile. Isso **não é controlável
por código** — é setting do emulador:

- Ghostty: `adjust-cell-height = -2` no config
- iTerm2: Profile → Text → Vertical character spacing = 1.00
- Kitty: `modify_font cell_height 0px` em `kitty.conf`
- WezTerm: `line_height = 1.0`
- VS Code: `terminal.integrated.lineHeight: 1.0`

Se o usuário reportar "gap entre linhas", é isso — sugerir o setting ao
invés de tentar corrigir no código.

### Commits
- Antes de commitar: `bun test && bunx tsc --noEmit` precisa estar verde.
- Mensagem no imperativo, em português, com contexto do "por quê" quando a
  mudança não for óbvia.

## Pontos de extensão

- **Tamanho do tabuleiro**: `BOARD_SIZE` em `engine.ts`. Mudar isso requer
  revisar o layout do Board e possivelmente `TILE_WIDTH`/`TILE_HEIGHT` se o
  terminal do usuário for estreito.
- **Tamanho do tile**: `TILE_WIDTH` e `TILE_HEIGHT` em `src/components/Tile.tsx`.
  Par visual quadrado (~1:1) pede `cellsWide ≈ 2 × cellsTall`. Atual: 10×5.
- **Paleta**: `src/palette.ts`. Dois esquemas: `ansi` (padrão, nomes de cor do
  Ink) e `truecolor` (hex clássico). Cada um define um high-fallback para
  tiles acima de 8192. Para adicionar um esquema novo: acrescentar ao union
  `ColorScheme`, construir o objeto `Palette` correspondente e estender
  `getPalette()`. `COLOR_SCHEMES` é usado pela CLI na mensagem de ajuda.
- **Timing de animação**: `PHASE_MS` em `src/animations.ts`. Aumentar `sliding`
  torna o movimento mais visível; diminuir deixa o jogo mais snappy.
- **Tipografia dos dígitos**: `src/fonts/`. Para adicionar um font novo:
  1. Criar `src/fonts/<nome>.ts` com os 10 bitmaps 0-9 e objeto `Font`.
  2. Adicionar em `FONT_NAMES`, `FONTS` e `parseFontName` de `src/fonts/index.ts`.
  3. Cobrir com testes em `src/fonts/fonts.test.ts` (describe.each cobre todos).
  Dimensão limite: `N * (width + letterSpacing) - letterSpacing ≤ cellsWide * 2`
  (em sub-pixels) para o label máximo "8192" (N=4) caber. Com braille (20
  sub-pixels horizontais no tile 10-cell), width máximo = 4. Se precisar mais,
  aumentar `TILE_WIDTH`.

## Atalho para depurar animações

`renderFrame(anim)` é uma função pura — dá para inspecionar qualquer frame
isoladamente. Em testes, chame `planMove(state)` para obter o `MoveAnimation`
inicial e avance com `nextPhase` para comparar os frames esperados. Nunca é
necessário renderizar para DOM/terminal para testar animação.
