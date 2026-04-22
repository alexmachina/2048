#!/usr/bin/env bash
# PostToolUse hook — roda `bunx tsc --noEmit` quando um arquivo .ts/.tsx é editado.
#
# Porquê: CLAUDE.md diz que `tsc --noEmit` é autoritativo e o LSP fica stale.
# Esse hook garante feedback imediato após cada edit, sem esperar o dev rodar
# `/check` ou commitar. Não-bloqueante (exit 0 sempre) — só emite diagnostics.
#
# Entrada: JSON do Claude Code em stdin com `.tool_input.file_path`.
# Saída: stdout do tsc vai para Claude; exit 0 não bloqueia a continuação.

set -u

# Extrai file_path do payload. Falha silenciosa se jq não existir.
if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

file=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Só roda para .ts/.tsx
case "$file" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# cd para o project dir garante que tsc ache o tsconfig.json
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0

# Roda tsc; captura stdout+stderr. Exit code 0 = sucesso, ≠ 0 = erros de tipo.
output=$(bunx tsc --noEmit 2>&1)
status=$?

if [ $status -ne 0 ]; then
  printf '⚠️  tsc --noEmit reportou erros após editar %s:\n\n%s\n' "$file" "$output"
fi

# Sempre 0 — erros são feedback, não bloqueio.
exit 0
