/**
 * Mitiga flicker em terminais GPU-accelerated (Alacritty 0.13+, Kitty, WezTerm
 * recente) encapsulando cada `process.stdout.write` em sequências DECSET 2026
 * — "synchronized output mode":
 *
 *   ESC [ ? 2026 h   → begin synchronized update
 *   (escrita do frame)
 *   ESC [ ? 2026 l   → end; terminal faz swap atômico
 *
 * Sem isso, `log-update` (usado pelo Ink) emite "erase N linhas + reescrever
 * N linhas" e o Alacritty aplica cada passo imediatamente no framebuffer,
 * gerando o flash que a gente vê entre frames de animação. Terminal.app tem
 * buffer mais lento e o olho não percebe — por isso o bug só aparecia lá.
 *
 * Terminais que não suportam 2026 **ignoram silenciosamente** o escape (é
 * private-mode, spec manda ignorar modes desconhecidos). Então essa função
 * é no-op safe em qualquer lugar.
 *
 * Idempotente: chamar 2x não envelopa 2x.
 */

let patched = false;

const BEGIN = '\u001b[?2026h';
const END = '\u001b[?2026l';

export function enableSyncOutput(): void {
  if (patched) return;
  if (!process.stdout.isTTY) return; // pipes/arquivos não precisam
  patched = true;

  const original = process.stdout.write.bind(process.stdout);

  // Node tipa `write` com overloads (chunk, cb) e (chunk, encoding, cb).
  // Passamos ...args direto pro original; só mexemos no chunk se for string.
  (process.stdout as { write: unknown }).write = function syncWrite(
    ...args: unknown[]
  ): boolean {
    const chunk = args[0];
    if (typeof chunk === 'string' && chunk.length > 0) {
      args[0] = BEGIN + chunk + END;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (original as any)(...args);
  };
}
