#!/usr/bin/env bash
# PostToolUse hook — roda o teste pareado de um arquivo de src/.
#
# Porquê: mudanças em src/foo.ts invalidam src/foo.test.ts. Rodar só o teste
# pareado dá feedback em <1s sem rodar a suite inteira. Cobrir o caso cross-file
# (ex: mudança em palette.ts afeta canvas.test.ts) fica com `/check` manual.
#
# Entrada: JSON via stdin. Saída: stdout do bun test vai pro Claude.

set -u

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

file=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Só dispara em src/*.ts e src/*.tsx, e evita loop se o próprio edit foi o .test
case "$file" in
  */src/*.test.ts|*/src/*.test.tsx) exit 0 ;;
  */src/*.ts|*/src/*.tsx) ;;
  *) exit 0 ;;
esac

# Monta o path do teste pareado: foo.ts -> foo.test.ts
case "$file" in
  *.tsx) test_file="${file%.tsx}.test.tsx" ;;
  *.ts)  test_file="${file%.ts}.test.ts" ;;
esac

# Só roda se o teste pareado existe
[ -f "$test_file" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0

output=$(bun test "$test_file" 2>&1)
status=$?

if [ $status -ne 0 ]; then
  printf '⚠️  %s quebrou após editar %s:\n\n%s\n' "$(basename "$test_file")" "$(basename "$file")" "$output"
fi

exit 0
