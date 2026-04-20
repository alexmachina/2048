---
description: Renderizar um frame do jogo em modo não-interativo para inspeção
---

Rode:

```
(timeout 1 bun run src/cli.tsx 2>&1 </dev/null || true) | head -40
```

Ink vai emitir o primeiro frame e depois reclamar de "Raw mode not supported"
(esperado em stdin não-TTY). Isso é normal — ignore a mensagem e reporte o
frame inicial (HUD + board + help line).

Responda apenas com o output capturado dentro de um bloco de código, seguido
de **1 frase** sobre o que está visível (ex: "Board 4×4 com 2 tiles de valor
2 posicionados aleatoriamente"). Nada além.
