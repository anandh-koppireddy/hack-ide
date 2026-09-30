import type { Monaco } from '@monaco-editor/react';

export function registerHackLanguage(monaco: Monaco) {
  // Check if already registered
  const languages = monaco.languages.getLanguages();
  if (languages.some((l: { id: string }) => l.id === 'hack')) {
    return;
  }

  // Register language ID
  monaco.languages.register({ id: 'hack' });

  // Define Monarch syntax tokenizer
  monaco.languages.setMonarchTokensProvider('hack', {
    tokenizer: {
      root: [
        // Comments
        [/\/\/.*$/, 'comment'],

        // Labels: (LABEL)
        [/\([A-Za-z_.$:][A-Za-z0-9_.$:]*\)/, 'type.identifier'],

        // A-Instructions: @value or @symbol
        [/@[A-Za-z_.$:][A-Za-z0-9_.$:]*/, 'variable.name'],
        [/@\d+/, 'number'],

        // Predefined virtual registers
        [/\b(R[0-9]|R1[0-5]|SP|LCL|ARG|THIS|THAT|SCREEN|KBD)\b/, 'keyword'],

        // Destination registers and Jump directives
        [/\b(AMD|AM|AD|MD|M|D|A)\b(?=\s*=)/, 'variable.predefined'],
        [/\b(JGT|JEQ|JGE|JLT|JNE|JLE|JMP)\b/, 'keyword.control'],

        // ALU Operators
        [/[\+\-\&\|\!\=;]/, 'operator'],

        // Numeric constants
        [/\b\d+\b/, 'number'],
      ],
    },
  });

  // Define the custom dark theme
  monaco.editor.defineTheme('hack-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
      { token: 'type.identifier', foreground: '4ec9b0', fontStyle: 'bold' },
      { token: 'variable.name', foreground: '9cdcfe' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'keyword', foreground: 'c586c0' },
      { token: 'variable.predefined', foreground: 'dcdcaa' },
      { token: 'keyword.control', foreground: 'ce9178', fontStyle: 'bold' },
      { token: 'operator', foreground: 'd4d4d4' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#c6c6c6',
    },
  });
}