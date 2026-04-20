# Sub-cell rendering

Por que os números dos tiles são desenhados como bitmap em vez de texto, e
como a pipeline funciona. Documento vivo — leitura obrigatória antes de mexer
em `src/canvas.ts`, `src/digit-font.ts` ou `src/components/Tile.tsx`.

## O problema

O terminal é uma **grade de células discretas**. Um caractere monoespaçado
ocupa exatamente 1 célula. Sub-pixel positioning em texto não existe: um label
de 1 caractere em uma célula de 8 de largura sempre distribui 3+4 ou 4+3
espaços nas laterais, nunca 3.5+3.5. O olho percebe essa assimetria de meio-
glifo como "descentrado" — foi exatamente o que motivou esta camada.

Duas saídas possíveis:

1. **Protocolos gráficos do emulador** (Kitty graphics, Sixel, iTerm2 images).
   Qualidade máxima, mas terminal-dependente — não roda no Terminal.app, VS
   Code terminal padrão, etc.
2. **Caracteres Unicode que codificam múltiplos sub-pixels por célula.**
   Portável em qualquer terminal com Unicode. Escolhemos esta rota.

## Encodings

### Quadrant — padrão atual

`src/canvas.ts:canvasToQuadrant`

- **2×2 sub-pixels por célula** (4 dots, 2⁴ = 16 combinações)
- Codepoints: bloco "Block Elements" (U+2580..U+259F)
- Bit layout por célula:

  ```
  col0  col1
  0x1   0x2    row 0 (top)
  0x4   0x8    row 1 (bottom)
  ```

- Tabela (índice 0b0000..0b1111): ` `, `▘`, `▝`, `▀`, `▖`, `▌`, `▞`, `▛`, `▗`, `▚`, `▐`, `▜`, `▄`, `▙`, `▟`, `█`
- Empty cell usa `U+0020` (espaço) em vez de um bloco "vazio" dedicado — o
  background do `<Text>` passa limpo.
- Unicode 1.1 (1993) — suporte universal em qualquer fonte monoespaçada.
- Visual: pixels chunky, sensação de "tile sólido com número em relevo".

### Braille — alternativa

`src/canvas.ts:canvasToBraille`

- **2×4 sub-pixels por célula** (8 dots, 2⁸ = 256 combinações)
- Codepoints: U+2800 + byte, bloco Braille Patterns.
- Bit layout por célula:

  ```
  col0   col1
  0x01   0x08   row 0
  0x02   0x10   row 1
  0x04   0x20   row 2
  0x40   0x80   row 3
  ```

- Unicode 3.0 (1999) — suporte amplo.
- Visual: dots finos, estilo LCD digital / calculadora.
- Para trocar: `labelOnTile(label, w, h, 'braille')` no `Tile.tsx`.

### Alternativas descartadas

| Encoding | Resolução | Por que descartado |
|----------|-----------|--------------------|
| Sextants (`U+1FB00+`) | 2×3 | Suporte de fonte irregular |
| Octants (`U+1CD00+`) | 2×4 (blocos) | Unicode 16.0 (2024), poucas fontes |
| Half-blocks (`▀▄`) | 1×2 | Resolução baixa demais |
| FIGfonts / cfonts | varia | Não é sub-célula, só ASCII-art grande |
| Kitty graphics / sixel | pixel real | Terminal-dependente |

## Pipeline

```
┌──────────────────┐
│  digit-font.ts   │  3×5 bitmap por dígito 0-9 (DIGIT_W, DIGIT_H exportados)
└────────┬─────────┘
         │ bitmapFor('2') → number[][]
         ▼
┌──────────────────┐
│    canvas.ts     │  Canvas = number[][] de sub-pixels 0/1
│                  │  drawLabel(canvas, label, x, y) pinta em (x,y)
└────────┬─────────┘
         │ canvasToQuadrant | canvasToBraille
         ▼
┌──────────────────┐
│   Tile.tsx       │  Uma linha = um <Text> de cellsWide caracteres.
│                  │  fg = cor do dígito · bg = cor do tile.
│                  │  Pulse: swap fg↔bg. Dim: dimColor no <Text>.
└──────────────────┘
```

Conveniência: `labelOnTile(label, cellsWide, cellsTall, encoding)` faz tudo —
aloca o canvas certo para o encoding, centraliza via `floor((w - labelWidth)/2)`,
pinta, serializa. Retorna `string[]` com uma linha por cell-row.

## Dimensões atuais

| | Cells (x × y) | Sub-pixels canvas (x × y) | Aspecto visual |
|---|---|---|---|
| Tile | **10 × 5** | 20 × 10 (quadrant) / 20 × 20 (braille) | ~1:1 (quadrado) |
| Dígito (3×5) | ~1.5 × ~2.5 cells | 3 × 5 sub-pixels | — |
| Label 4 dígitos | ~7.5 × ~2.5 cells | 15 × 5 sub-pixels | — |

**Por que 10×5 e não outro tamanho**: cada célula monoespaçada é ~1:2
(larg:alt), então `cellsWide ≈ 2 × cellsTall` dá um tile visualmente
quadrado. 10×5 foi escolhido para equilibrar:

- **Quadrado visual** (10 × 5 × 2 = 10 × 10).
- **Padding confortável**: dígito 3×5 no centro deixa cell-row 0 e cell-row 4
  totalmente vazias (só bg color), dígito aparece nas 3 cells do meio.
- **Largura total do board** = 4×10 + 3 gaps + 2 padding + 2 border = 47 cols
  → cabe em 80-col terminal.
- **Altura total** = 4×5 + 3 gaps + 2 border = 25 linhas, ~30 com HUD/help —
  aperta em terminais 24-line mas OK em setups modernos.

**Centralização**: horizontal tem `±0.5 sub-pixel` de desvio para todos
os labels (porque labels medem 3/7/11/15 sub-pixels, todos ímpares, e canvas
é sempre par). Vertical idem para dígito 5-tall em canvas 10. Na prática,
inferior a 0.25 célula — imperceptível.

Se precisar **zero desvio**:

- Fonte de dígito 4-wide (par) e labels com espaçamento ajustado.
- Canvas ímpar (inviável com encoding de 2 sub-pixels por cell vertical/horizontal).

O compromisso atual prioriza legibilidade e padding sobre o último 0.25
célula de alinhamento.

## Como estender

- **Trocar encoding no Tile**: quarto argumento de `labelOnTile`.
- **Adicionar encoding novo**:
  1. Função `canvasToX(canvas)` em `canvas.ts`.
  2. Entry em `SUBPIXELS_PER_CELL`.
  3. Rota em `labelOnTile`.
  4. Testes em `canvas.test.ts` (padrões conhecidos → codepoints esperados).
- **Aumentar/reduzir dígito**: editar `src/digit-font.ts` (ajustar `DIGIT_W`,
  `DIGIT_H` e todos os bitmaps). Atenção ao `labelWidth` — se o label máximo
  ultrapassar `cellsWide * 2` sub-pixels, aumentar o tile ou apertar
  `LETTER_SPACING`.
- **Suportar caracteres extras** (ex: sinal `+` para animação de score ganho):
  adicionar entry em `DIGITS` map de `digit-font.ts`. `drawLabel` aceita
  qualquer char como chave — caracteres desconhecidos são ignorados em
  silêncio.

## Testes

`src/canvas.test.ts` cobre:

- `createCanvas` — dimensões e zero-fill.
- `labelWidth` — aritmética de largura.
- `canvasToBraille` e `canvasToQuadrant` — padrões conhecidos (empty, full,
  half, diagonal) produzindo os codepoints certos.
- `drawLabel` — pintura nos pixels corretos, letter spacing, chars desconhecidos.
- `labelOnTile` — encoding padrão (quadrant), override (braille), fit para
  labels de 1-4 dígitos.
