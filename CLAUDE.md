# CLAUDE.md

Contexto para o Claude Code trabalhar neste repositório.

## Projeto

2048 em terminal, escrito em TypeScript, executado por Bun, renderizado com
Ink 5. A lógica de jogo é pura (sem efeitos colaterais) e separada da UI para
poder ser testada sem subir um TTY.

## Comandos

```bash
bun install              # instalar dependências
bun run start            # rodar o jogo (precisa de TTY real)
bun run src/cli.tsx      # equivalente

bun test                 # rodar os 26 testes
bunx tsc --noEmit        # checagem de tipos (autoritativo — diagnostics do
                         #   LSP podem ficar stale; confie no exit code do tsc)
```

## Arquitetura

```
src/
├── engine.ts        — regras puras. Estado e metadata de animação (slidFrom,
│                      mergedFrom, isNew) vivem aqui, mas não há nada de I/O.
├── animations.ts    — máquina de estados sliding → merging → spawning → idle.
│                      renderFrame(anim) devolve um DisplayTile[] por frame.
├── palette.ts       — cores por valor de tile + PULSE_BG e cores do board.
├── cli.tsx          — entry Ink. useInput dispara move(); useEffect avança
│                      frames via setTimeout(frameDurationMs(anim)).
└── components/
    ├── Board.tsx    — grid 4×4; resolve colisões de célula preferindo tiles
    │                  com pulse.
    ├── Tile.tsx     — célula de 3 linhas × 8 colunas montada com <Text>
    │                  empilhado (veja a ressalva de Ink abaixo).
    └── Hud.tsx      — score, best, banners de vitória/derrota.
```

## Convenções

### Testes
- `bun test` é a ferramenta. Os arquivos de teste vivem ao lado do código
  (`engine.test.ts`, `animations.test.ts`).
- Testes novos devem ser **determinísticos**: engine aceita `rng: () => number`
  injetável, então nunca use `Math.random` nos testes — passe `() => 0` ou um
  LCG seedado (há um helper `seededRng` em `engine.test.ts`).
- TDD: escreva o teste antes da implementação. Não é negociável para mudanças
  no engine.

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

Se subir para Ink 7, reavaliar — algumas APIs mudam.

### Rendering dos números (sub-célula)

Os dígitos de cada tile são desenhados como **bitmap pixelado** via caracteres
Unicode que codificam múltiplos sub-pixels por célula. Isso existe para
contornar a assimetria de centralização da grade de células — texto ASCII
comum centraliza com precisão de 1 célula, o bitmap chega a ~0.5 célula.

- **Quadrant** (`U+2580..U+259F`, **padrão**): 2×2 sub-pixels por célula.
  Visual chunky, tile sólido com número em relevo. Suporte universal.
- **Braille** (`U+2800..U+28FF`): 2×4 sub-pixels por célula. Visual fino,
  estilo LCD. Mantido em `src/canvas.ts` como alternativa.

Pipeline: `src/digit-font.ts` (bitmap 3×5 por dígito) → `src/canvas.ts` pinta
em grid 0/1 → `canvasToQuadrant` / `canvasToBraille` serializa em strings de
caracteres Unicode, uma string por linha de células. Ver
[`docs/sub-cell-rendering.md`](docs/sub-cell-rendering.md) para bit layouts,
alternativas descartadas e como estender.

**Se precisar adicionar caracteres** (ex: `+` para animação de score) a
entrada vai em `DIGITS` de `digit-font.ts`. Caracteres desconhecidos são
ignorados em silêncio por `drawLabel`.

### Commits
- Antes de commitar: `bun test && bunx tsc --noEmit` precisa estar verde.
- Mensagem no imperativo, em português, com contexto do "por quê" quando a
  mudança não for óbvia.

## Pontos de extensão

- **Tamanho do tabuleiro**: `BOARD_SIZE` em `engine.ts`. Mudar isso requer
  ajustar também a largura/altura do `Tile` e do `Board` se o terminal do
  usuário for estreito.
- **Paleta**: `src/palette.ts`. Tiles acima de 8192 caem no `HIGH_FALLBACK`.
- **Timing**: `PHASE_MS` em `animations.ts`. Aumentar `sliding` torna o
  movimento mais visível; diminuir deixa o jogo mais snappy.

## Atalho para depurar animações

`renderFrame(anim)` é uma função pura — dá para inspecionar qualquer frame
isoladamente. Em testes, chame `planMove(state)` para obter o `MoveAnimation`
inicial e vá avançando com `nextPhase` para comparar os frames esperados.
Nunca é necessário renderizar para DOM/terminal para testar animação.
