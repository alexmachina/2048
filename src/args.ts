import {
  COLOR_SCHEMES,
  DEFAULT_COLOR_SCHEME,
  parseColorScheme,
  type ColorScheme,
} from './palette';
import {
  DEFAULT_FONT,
  FONT_NAMES,
  parseFontName,
  type FontName,
} from './fonts';

export type ParsedArgs =
  | { kind: 'ok'; scheme: ColorScheme; font: FontName }
  | { kind: 'help' }
  | { kind: 'error'; message: string };

export function parseCliArgs(argv: readonly string[]): ParsedArgs {
  let scheme: ColorScheme = DEFAULT_COLOR_SCHEME;
  let font: FontName = DEFAULT_FONT;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') return { kind: 'help' };

    let raw: string | undefined;
    let which: 'colors' | 'font' | null = null;

    if (arg === '--colors' || arg === '-c') {
      raw = argv[++i];
      which = 'colors';
    } else if (arg.startsWith('--colors=')) {
      raw = arg.slice('--colors='.length);
      which = 'colors';
    } else if (arg === '--font' || arg === '-f') {
      raw = argv[++i];
      which = 'font';
    } else if (arg.startsWith('--font=')) {
      raw = arg.slice('--font='.length);
      which = 'font';
    } else {
      return { kind: 'error', message: `Opção desconhecida: ${arg}` };
    }

    if (raw === undefined) {
      return { kind: 'error', message: `${arg} requer um valor` };
    }

    if (which === 'colors') {
      const parsed = parseColorScheme(raw);
      if (!parsed) {
        return {
          kind: 'error',
          message: `Esquema de cores inválido: "${raw}". Válidos: ${COLOR_SCHEMES.join(', ')}`,
        };
      }
      scheme = parsed;
    } else {
      const parsed = parseFontName(raw);
      if (!parsed) {
        return {
          kind: 'error',
          message: `Tipografia inválida: "${raw}". Válidos: ${FONT_NAMES.join(', ')}`,
        };
      }
      font = parsed;
    }
  }
  return { kind: 'ok', scheme, font };
}

export const USAGE = `Uso: 2048 [opções]

Opções:
  -c, --colors <esquema>  Esquema de cores do jogo.
                          Valores: ${COLOR_SCHEMES.join(', ')}
                          Padrão: ${DEFAULT_COLOR_SCHEME}
  -f, --font <tipografia> Tipografia dos números nos tiles.
                          Valores: ${FONT_NAMES.join(', ')}
                          Padrão: ${DEFAULT_FONT}
  -h, --help              Mostra esta mensagem.

Exemplos:
  2048                              # ansi + classic (padrão)
  2048 --colors truecolor           # paleta hex clássica
  2048 --font 7seg                  # números em LCD calculadora
  2048 --font solari --colors ansi  # painel de aeroporto
  2048 --font nixie --colors truecolor
`;
