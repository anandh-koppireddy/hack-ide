import type{ ParsedInstruction, DiagnosticError } from '../types/hack';

export interface ParseResult {
  instructions: ParsedInstruction[];
  diagnostics: DiagnosticError[];
}

export function parseHackSource(source: string): ParseResult {
  const lines = source.split(/\r?\n/);
  const instructions: ParsedInstruction[] = [];
  const diagnostics: DiagnosticError[] = [];

  lines.forEach((originalLine, index) => {
    const lineNumber = index + 1;

    // 1. Strip comments and trim whitespace
    const commentIndex = originalLine.indexOf('//');
    const cleanLine = (commentIndex !== -1 ? originalLine.slice(0, commentIndex) : originalLine).trim();

    if (cleanLine.length === 0) {
      return; // Skip empty lines or comment-only lines
    }

    const columnStart = originalLine.indexOf(cleanLine) + 1;
    const columnEnd = columnStart + cleanLine.length;

    // 2. Parse Labels: (LABEL_NAME)
    if (cleanLine.startsWith('(')) {
      if (!cleanLine.endsWith(')')) {
        diagnostics.push({
          lineNumber,
          columnStart,
          columnEnd,
          message: `Unclosed label declaration: missing ')'`,
          severity: 'error',
        });
        return;
      }

      const labelContent = cleanLine.slice(1, -1).trim();
      const validSymbolRegex = /^[A-Za-z_.$:][A-Za-z0-9_.$:]*$/;

      if (!validSymbolRegex.test(labelContent)) {
        diagnostics.push({
          lineNumber,
          columnStart,
          columnEnd,
          message: `Invalid label identifier '${labelContent}'`,
          severity: 'error',
        });
        return;
      }

      instructions.push({
        type: 'LABEL',
        raw: cleanLine,
        lineNumber,
        label: labelContent,
      });
      return;
    }

    // 3. Parse A-instructions: @value
    if (cleanLine.startsWith('@')) {
      const target = cleanLine.slice(1).trim();

      if (target.length === 0) {
        diagnostics.push({
          lineNumber,
          columnStart,
          columnEnd,
          message: `Empty '@' instruction: expected symbol or decimal constant`,
          severity: 'error',
        });
        return;
      }

      const isDecimal = /^[0-9]+$/.test(target);
      const isSymbol = /^[A-Za-z_.$:][A-Za-z0-9_.$:]*$/.test(target);

      if (!isDecimal && !isSymbol) {
        diagnostics.push({
          lineNumber,
          columnStart,
          columnEnd,
          message: `Invalid A-instruction target '${target}'`,
          severity: 'error',
        });
        return;
      }

      if (isDecimal) {
        const numericVal = parseInt(target, 10);
        if (numericVal > 32767) {
          diagnostics.push({
            lineNumber,
            columnStart,
            columnEnd,
            message: `Address constant ${numericVal} exceeds 15-bit address space (0-32767)`,
            severity: 'error',
          });
        }

        instructions.push({
          type: 'A_INSTRUCTION',
          raw: cleanLine,
          lineNumber,
          value: target,
          isSymbol: false,
          numericValue: numericVal,
        });
      } else {
        instructions.push({
          type: 'A_INSTRUCTION',
          raw: cleanLine,
          lineNumber,
          value: target,
          isSymbol: true,
        });
      }
      return;
    }

    // 4. Parse C-instructions: dest=comp;jump
    let dest: string | undefined;
    let comp: string;
    let jump: string | undefined;

    let remaining = cleanLine;

    // Check dest=
    if (remaining.includes('=')) {
      const parts = remaining.split('=');
      if (parts.length > 2) {
        diagnostics.push({
          lineNumber,
          columnStart,
          columnEnd,
          message: `Syntax error: multiple '=' characters in C-instruction`,
          severity: 'error',
        });
        return;
      }
      dest = parts[0].trim();
      remaining = parts[1].trim();
    }

    // Check ;jump
    if (remaining.includes(';')) {
      const parts = remaining.split(';');
      if (parts.length > 2) {
        diagnostics.push({
          lineNumber,
          columnStart,
          columnEnd,
          message: `Syntax error: multiple ';' characters in C-instruction`,
          severity: 'error',
        });
        return;
      }
      comp = parts[0].trim();
      jump = parts[1].trim();
    } else {
      comp = remaining.trim();
    }

    if (!comp) {
      diagnostics.push({
        lineNumber,
        columnStart,
        columnEnd,
        message: `Missing computation expression in C-instruction`,
        severity: 'error',
      });
      return;
    }

    instructions.push({
      type: 'C_INSTRUCTION',
      raw: cleanLine,
      lineNumber,
      dest,
      comp,
      jump,
    });
  });

  return { instructions, diagnostics };
}