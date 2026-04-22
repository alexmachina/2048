import type { GameState } from './engine';

/**
 * Histórico de profundidade 1 — regra explícita do design: o jogador pode
 * desfazer a ÚLTIMA jogada, nunca duas seguidas. Por isso o histórico guarda
 * no máximo um "pre-state" e cada `pushMove` sobrescreve o anterior.
 *
 * A alternativa seria um stack ilimitado, mas isso abriria a porta pra
 * "jogar em modo exploratório" (tentar um caminho e sempre voltar), o que
 * tira o peso das decisões. Undo de 1 passo é um safety net, não um botão
 * de exploração.
 *
 * Invariante: `previous === null` ⇔ `canUndo === false`.
 */
export type History = {
  readonly previous: GameState | null;
};

export function initHistory(): History {
  return { previous: null };
}

export function canUndo(history: History): boolean {
  return history.previous !== null;
}

/**
 * Registra que `from` virou `to`. Descarta qualquer pre-state anterior —
 * undo é profundidade 1.
 *
 * O parâmetro `to` não é usado pelo struct, mas o nome da função sugere uma
 * transição real — chamar com estados iguais não faz sentido semanticamente,
 * embora não seja validado aqui (o engine já garante que moves sem efeito
 * retornam a mesma referência, então o call site não chama pushMove nesse
 * caso).
 */
export function pushMove(
  _history: History,
  from: GameState,
  _to: GameState,
): History {
  return { previous: from };
}

/**
 * Desfaz a última jogada. Retorna `null` se não há o que desfazer.
 *
 * O `currentState` só é usado pra coerência de API — não afeta o resultado,
 * mas deixa explícito no call site "undo a partir de X". Idiom comum em
 * reducers.
 *
 * Após undo, o histórico fica vazio — o usuário tem que fazer uma nova
 * jogada antes de poder desfazer de novo.
 */
export function undo(
  history: History,
  _currentState: GameState,
): { state: GameState; history: History } | null {
  if (history.previous === null) return null;
  return {
    state: history.previous,
    history: initHistory(),
  };
}
