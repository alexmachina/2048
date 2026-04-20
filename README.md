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
- Terminal com suporte a cores 24-bit (a maioria dos terminais modernos serve).

## Instalação e execução

```bash
bun install
bun run start
```

Atalhos equivalentes:

```bash
bun run src/cli.tsx
```

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
├── engine.test.ts     — 17 testes de lógica
├── animations.ts      — máquina de estados de frames (sliding → merging → spawning → idle)
├── animations.test.ts — 9 testes das transições e do render por frame
├── palette.ts         — cores por valor de tile
├── cli.tsx            — entrypoint: input, loop de frames, layout
└── components/
    ├── Board.tsx      — grid 4×4
    ├── Tile.tsx       — célula preenchida (3 linhas × 8 colunas)
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
