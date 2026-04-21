import {
  COLOR_SCHEMES,
  DEFAULT_COLOR_SCHEME,
  parseColorScheme,
  type ColorScheme,
} from './palette';

export type ParsedArgs =
  | { kind: 'ok'; scheme: ColorScheme }
  | { kind: 'help' }
  | { kind: 'error'; message: string };

export function parseCliArgs(argv: readonly string[]): ParsedArgs {
  let scheme: ColorScheme = DEFAULT_COLOR_SCHEME;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') return { kind: 'help' };
    let raw: string | undefined;
    if (arg === '--colors' || arg === '-c') {
      raw = argv[++i];
    } else if (arg.startsWith('--colors=')) {
      raw = arg.slice('--colors='.length);
    } else {
      return { kind: 'error', message: `Opção desconhecida: ${arg}` };
    }
    if (raw === undefined) {
      return { kind: 'error', message: `${arg} requer um valor` };
    }
    const parsed = parseColorScheme(raw);
    if (!parsed) {
      return {
        kind: 'error',
        message: `Esquema de cores inválido: "${raw}". Válidos: ${COLOR_SCHEMES.join(', ')}`,
      };
    }
    scheme = parsed;
  }
  return { kind: 'ok', scheme };
}

export const USAGE = `Uso: 2048 [opções]

Opções:
  -c, --colors <esquema>  Esquema de cores do jogo.
                          Valores: ${COLOR_SCHEMES.join(', ')}
                          Padrão: ${DEFAULT_COLOR_SCHEME}
  -h, --help              Mostra esta mensagem.

Exemplos:
  2048                    # usa o esquema ansi (padrão)
  2048 --colors truecolor # usa a paleta hex clássica do 2048
`;
