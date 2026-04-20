---
description: Rodar testes e type-check em paralelo, reportar estado do projeto
---

Execute os dois comandos em paralelo (uma única mensagem com duas chamadas
Bash) e reporte o resultado de cada um:

1. `bun test` — deve passar todos os testes. Reporte nº passou / falhou.
2. `bunx tsc --noEmit` — exit code 0 significa sem erros de tipo. Reporte o
   exit code.

Se algum falhar, não tente corrigir — apenas reporte o que falhou para o
usuário decidir o próximo passo. Responda em **no máximo 3 linhas**.
