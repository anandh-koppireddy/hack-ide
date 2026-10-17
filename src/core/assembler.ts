import { parseHackSource } from './parser';
import { buildLabelSymbolTable } from './symbolTable';
import { validateArchitectureRules } from './rules';
import { compileAInstruction, compileCInstruction } from './codeGen';
import type { DiagnosticError } from '../types/hack';

export interface AssembleResult {
  binaryLines: string[];
  diagnostics: DiagnosticError[];
  symbolTable: Record<string, number>;
}

export function assembleHackSource(source: string): AssembleResult {
  const { instructions, diagnostics: parseDiagnostics } = parseHackSource(source);
  const ruleDiagnostics = validateArchitectureRules(instructions);
  const totalDiagnostics = [...parseDiagnostics, ...ruleDiagnostics];

  if (totalDiagnostics.length > 0) {
    return { binaryLines: [], diagnostics: totalDiagnostics, symbolTable: {} };
  }

  const symbolTable = buildLabelSymbolTable(instructions);
  const binaryLines: string[] = [];

  for (const inst of instructions) {
    const raw = inst as any;

    const isAInstruction =
      raw.type === 'A_INSTRUCTION' ||
      raw.type === 'A_COMMAND' ||
      raw.instructionType === 'A_COMMAND';

    const isCInstruction =
      raw.type === 'C_INSTRUCTION' ||
      raw.type === 'C_COMMAND' ||
      raw.instructionType === 'C_COMMAND';

    if (isAInstruction) {
      const rawIdentifier = raw.symbol ?? raw.value ?? raw.address;
      let numericAddress: number;

      if (rawIdentifier !== undefined && rawIdentifier !== null) {
        // Strip '@' if the parser retained it
        const strVal = String(rawIdentifier).replace(/^@/, '').trim();
        const parsedNum = Number(strVal);

        if (!isNaN(parsedNum)) {
          numericAddress = parsedNum;
        } else if (symbolTable.contains(strVal)) {
          numericAddress = symbolTable.getAddress(strVal);
        } else {
          numericAddress = symbolTable.getOrAllocateVariable(strVal);
        }
      } else {
        numericAddress = 0;
      }

      binaryLines.push(compileAInstruction(numericAddress));
    } else if (isCInstruction) {
      binaryLines.push(compileCInstruction(raw.comp, raw.dest, raw.jump));
    }
  }

  return {
    binaryLines,
    diagnostics: totalDiagnostics,
    symbolTable: symbolTable.getTable(),
  };
}