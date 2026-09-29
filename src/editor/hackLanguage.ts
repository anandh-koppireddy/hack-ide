import type { languages } from 'monaco-editor';

export const HACK_LANGUAGE_ID = 'hack-asm';

export const hackLanguageConfig: languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
  },
  brackets: [
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '(', close: ')' },
  ],
};

export const hackMonarchTokens: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.hack',

  // Keywords and predefined registers
  registers: [
    'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
    'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15',
    'SP', 'LCL', 'ARG', 'THIS', 'THAT', 'SCREEN', 'KBD'
  ],

  destinations: ['M', 'D', 'MD', 'A', 'AM', 'AD', 'AMD'],
  jumps: ['JGT', 'JEQ', 'JGE', 'JLT', 'JNE', 'JLE', 'JMP'],

  tokenizer: {
    root: [
      // Comments: // ...
      [/\/\/.*$/, 'comment'],

      // Labels: (LABEL_NAME)
      [/\([A-Za-z_.$:][A-Za-z0-9_.$:]*\)/, 'type.identifier'],

      // A-instruction with constants: @1234
      [/@[0-9]+/, 'number'],

      // A-instruction with symbols: @LOOP, @SCREEN, @i
      [/@[A-Za-z_.$:][A-Za-z0-9_.$:]*/, 'variable.name'],

      // Jump mnemonics after semicolon
      [/;[A-Z]+/, {
        cases: {
          ';(JGT|JEQ|JGE|JLT|JNE|JLE|JMP)': 'keyword',
          '@default': 'invalid'
        }
      }],

      // Destination registers followed by '='
      [/[AMD]+(?=\=)/, {
        cases: {
          '(M|D|MD|A|AM|AD|AMD)': 'keyword.dest',
          '@default': 'invalid'
        }
      }],

      // Delimiters
      [/=/, 'delimiter'],

      // Registers standing alone in expressions
      [/\b(R[0-9]|R1[0-5]|SP|LCL|ARG|THIS|THAT|SCREEN|KBD)\b/, 'constant'],

      // Whitespace
      { include: '@whitespace' },
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
    ],
  },
};

export function registerHackLanguage(monaco: typeof import('monaco-editor')) {
  // Avoid re-registering on hot-reloads
  if (!monaco.languages.getLanguages().some(lang => lang.id === HACK_LANGUAGE_ID)) {
    monaco.languages.register({ id: HACK_LANGUAGE_ID });
    monaco.languages.setLanguageConfiguration(HACK_LANGUAGE_ID, hackLanguageConfig);
    monaco.languages.setMonarchTokensProvider(HACK_LANGUAGE_ID, hackMonarchTokens);
  }
}