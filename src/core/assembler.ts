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

  const { symbolTable, executableInstructions } = buildLabelSymbolTable(instructions);
  const binaryLines: string[] = [];

  for (const inst of executableInstructions) {
    if (inst.type === 'A_INSTRUCTION') {
      let numericAddress: number;

      if (inst.isSymbol) {
        numericAddress = symbolTable.resolveOrAllocateVariable(inst.value);
      } else {
        numericAddress = inst.numericValue!;
      }

      binaryLines.push(compileAInstruction(numericAddress));
    } else if (inst.type === 'C_INSTRUCTION') {
      binaryLines.push(compileCInstruction(inst.comp, inst.dest, inst.jump));
    }
  }

  return { binaryLines, diagnostics: [], symbolTable: (symbolTable as any).table || symbolTable };
}