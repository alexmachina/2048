# 2048

Implementação em terminal do jogo 2048, com Bun e [Ink](https://github.com/vadimdemedes/ink) (React para CLIs).

```
 2048                     SCORE      BEST
 junte os números até 2048

 ╭───────────────────────────────────────╮
 │                                       │
 │     2                4                │
 │                                       │
 │                                       │
 │     8       16       2                │
 │                                       │
 │                                       │
 │                                       │
 │             4                         │
 │                                       │
 ╰───────────────────────────────────────╯

 ↑ ↓ ← → ou w a s d para mover · r reinicia · q sai
```

## Requisitos

- [Bun](https://bun.sh) ≥ 1.3
- Terminal com suporte a cores ANSI (padrão) ou 24-bit (modo `truecolor`).

## Instalação e execução

```bash
bun install
bun run start
```

Atalhos equivalentes:

```bash
bun run src/cli.tsx
```

### Esquema de cores

Por padrão o jogo usa cores ANSI nomeadas, respeitando o tema do terminal.
Para a paleta hex clássica do 2048 (bege/amarelo/laranja), use `truecolor`:

```bash
bun run start -- --colors truecolor   # ou: -c truecolor
bun run start -- --help               # lista as opções
```

Valores aceitos: `ansi` (padrão), `truecolor`.

### Tipografia dos números

Os dígitos nos tiles são desenhados como bitmaps em sub-pixel. Existem
cinco tipografias, inspiradas em famílias clássicas de displays:

| Flag                    | Dimensão | Heritage                                            |
| ----------------------- | -------- | --------------------------------------------------- |
| `--font classic`        | 3×5      | Font original do 2048 em terminal — **padrão**      |
| `--font 7seg`           | 4×7      | LCD calculadora/despertador (88:88)                 |
| `--font dotmatrix`      | 4×7      | Scoreboard LED (Fenway Park)                        |
| `--font solari`         | 4×7      | Split-flap de aeroporto — com costura horizontal    |
| `--font nixie`          | 4×7      | Tubo a gás Nixie — '4' com topo aberto, '1' com flag |

```bash
bun run start -- --font 7seg
bun run start -- --font solari --colors truecolor
```

Aliases aceitos: `original`/`default` (→ classic), `seven-segment`,
`dot-matrix`, `split-flap`, `tube`.

Todos os dígitos renderizam em **bold** para maximizar contraste sobre a
cor do tile — em terminais 16-color isso intensifica as cores ANSI, em
terminais com fonte monoespaçada de múltiplos pesos isso engrossa os
traços dos blocos Unicode.

## Controles

| Tecla                 | Ação           |
| --------------------- | -------------- |
| `↑` `↓` `←` `→`       | Mover tiles    |
| `w` `a` `s` `d`       | Mover tiles    |
| `h` `j` `k` `l`       | Mover (vim)    |
| `r`                   | Reiniciar      |
| `q` / `Esc` / `Ctrl+C`| Sair           |

## Arquitetura

Três camadas bem separadas para que a lógica de jogo seja testável sem subir
um terminal:

```
src/
├── engine.ts          — regras puras (slide, merge, spawn, win/lose)
├── engine.test.ts     — testes de lógica
├── animations.ts      — máquina de estados de frames (sliding → merging → spawning → idle)
├── animations.test.ts — testes das transições e do render por frame
├── palette.ts         — esquemas de cor (ansi, truecolor) + PaletteContext
├── fonts/             — 4 tipografias de dígitos + FontContext
│   ├── seven-segment.ts, dot-matrix.ts, solari.ts, nixie.ts
│   └── index.ts
├── args.ts            — parser de argumentos da CLI
├── cli.tsx            — entrypoint: input, loop de frames, layout
└── components/
    ├── Board.tsx      — grid 4×4
    ├── Tile.tsx       — célula preenchida (TILE_WIDTH × TILE_HEIGHT)
    └── Hud.tsx        — score, best, banners
```

### Pipeline de animação

Cada movimento passa por três fases antes de voltar a `idle`:

1. **Sliding** — cada tile avança uma célula por frame (constante, ~45 ms por
   frame) até chegar ao destino. Quando dois tiles se fundem, ambas as fontes
   deslizam; na última frame ambos aparecem na célula-alvo.
2. **Merging** — tiles recém-fundidas piscam em branco (`PULSE_BG`) por duas
   frames (~90 ms cada), dando o "pop" de satisfação.
3. **Spawning** — o tile novo aparece primeiro em `dimColor`, depois no brilho
   normal.

O motor de jogo em si é síncrono: `move(state, dir, rng)` retorna o novo estado
com metadata (`slidFrom`, `mergedFrom`, `isNew`) que a camada de animação usa
para reproduzir a transição.

## Desenvolvimento

```bash
bun test                 # roda os testes (26 no total)
bunx tsc --noEmit        # checagem de tipos
```

## Personalização

A paleta fica em [`src/palette.ts`](src/palette.ts) e pode ser trocada
livremente. As durações de cada fase estão em `PHASE_MS` dentro de
[`src/animations.ts`](src/animations.ts) — diminuir o `sliding` torna o jogo
mais "esportivo", aumentar torna o merge mais dramático.
