---
name: visual-diff
description: Use quando precisar comparar variações visuais do UI do 2048 lado-a-lado (cantos, gaps, paletas, fonts, encodings) antes de commitar. Gera um script de preview em .claude/.scratch/ com boilerplate Ink.
---

# Preview visual iterativo

Quando tiver 2+ opções de design (ex: chamfer vs multi-cell corners, gap 1 vs 2, ansi vs truecolor), em vez de alternar código + rodar + voltar, monte um preview lado-a-lado num script scratch. A saída do terminal renderiza todas as variantes num frame único, permitindo comparação direta.

## Por que `.claude/.scratch/`

Gitignored (`.gitignore` linha `.claude/.scratch`). Não polui `git status`. Padrão consolidado — já existem 4 preview scripts lá.

## Template

Criar `.claude/.scratch/preview-<topico>.tsx`. Boilerplate mínimo:

```typescript
#!/usr/bin/env bun
// Compara <N variantes> do <aspecto visual> lado-a-lado.

import React from 'react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { render, Box, Text } from 'ink';
import { PaletteContext, getPalette } from '../../src/palette';
import { FontContext, getFont } from '../../src/fonts';
// ... outros imports específicos ao que você quer comparar

function Variant({ title, /* props específicas */ }: { title: string }) {
  return (
    <PaletteContext.Provider value={getPalette('ansi')}>
      <FontContext.Provider value={getFont('classic')}>
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="cyan">{title}</Text>
          {/* <ComponenteOuFragment /> */}
        </Box>
      </FontContext.Provider>
    </PaletteContext.Provider>
  );
}

function App() {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Variant title="A — <descrição>" />
      <Variant title="B — <descrição>" />
      <Variant title="C — <descrição>" />
    </Box>
  );
}

const inst = render(<App />);
// Delay pra o renderer pintar antes de sair. 150ms cobre com folga.
setTimeout(() => { inst.unmount(); process.exit(0); }, 150);
```

## Rodar

```bash
bun .claude/.scratch/preview-<topico>.tsx
```

Se estiver num pipe/CI (não-TTY), Ink ainda renderiza — o `/preview` slash command usa esse mesmo truque. Se estiver em TTY interativo, saída vai pro terminal normal; inspecione visualmente e volte ao código.

## Exemplos já no repo

| Arquivo | O que compara |
|---|---|
| `preview-corner-variants.tsx` | Estilos de canto (chamfer-small vs chamfer-large vs multi-cell) |
| `preview-gaps.tsx` | 3 configurações de marginLeft/marginTop no grid |
| `preview-final.tsx` | Snapshot do design aprovado (Hud + Board + help) |
| `preview-board.tsx` | Cenários do board em vários estados |

Use-os como referência estrutural antes de escrever o seu.

## Depois de decidir

1. Aplique a variante vencedora no componente real
2. **Não** apague o preview script — vira documentação histórica das decisões de design
3. Se a decisão tiver rationale não-óbvio, adicione comentário no código apontando o preview ("Ver `.claude/.scratch/preview-corner-variants.tsx` para alternativas consideradas")

## Quando NÃO usar

- Mudanças triviais óbvias (1 linha de padding)
- Coisas que só dá pra verificar com input interativo (animações mid-frame, teclado) — pra isso, usa `bun run start` direto
