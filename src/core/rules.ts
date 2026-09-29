import type { ParsedInstruction, DiagnosticError } from '../types/hack';

// Valid Hack ALU computation mnemonics
const VALID_COMPS = new Set([
  '0', '1', '-1', 'D', 'A', '!D', '!A', '-D', '-A',
  'D+1', 'A+1', 'D-1', 'A-1', 'D+A', 'D-A', 'A-D',
  'D&A', 'D|A', 'M', '!M', '-M', 'M+1', 'M-1',
  'D+M', 'D-M', 'M-D', 'D&M', 'D|M'
]);

const VALID_DESTS = new Set([
  'M', 'D', 'MD', 'A', 'AM', 'AD', 'AMD'
]);

const VALID_JUMPS = new Set([
  'JGT', 'JEQ', 'JGE', 'JLT', 'JNE', 'JLE', 'JMP'
]);

/**
 * Validates hardware-level architecture rules on parsed instructions:
 * 1. Checks that comp, dest, and jump mnemonics exist in the Hack ISA.
 * 2. Enforces hardware constraint: ALU cannot process both A and M simultaneously.
 */
export function validateArchitectureRules(instructions: ParsedInstruction[]): DiagnosticError[] {
  const diagnostics: DiagnosticError[] = [];

  for (const inst of instructions) {
    if (inst.type !== 'C_INSTRUCTION') {
      continue;
    }

    const { comp, dest, jump, lineNumber } = inst;

    // Hardware rule: Cannot reference both A and M in ALU computation
    if (comp.includes('A') && comp.includes('M')) {
      diagnostics.push({
        lineNumber,
        columnStart: 1,
        columnEnd: inst.raw.length + 1,
        message: `Hardware violation: Hack ALU cannot read register 'A' and memory 'M' in the same instruction ('${comp}')`,
        severity: 'error',
      });
      continue;
    }

    // Check validity of comp mnemonic
    if (!VALID_COMPS.has(comp)) {
      diagnostics.push({
        lineNumber,
        columnStart: 1,
        columnEnd: inst.raw.length + 1,
        message: `Illegal ALU operation '${comp}'`,
        severity: 'error',
      });
    }

    // Check validity of dest mnemonic if provided
    if (dest && !VALID_DESTS.has(dest)) {
      diagnostics.push({
        lineNumber,
        columnStart: 1,
        columnEnd: inst.raw.length + 1,
        message: `Invalid destination register '${dest}'`,
        severity: 'error',
      });
    }

    // Check validity of jump mnemonic if provided
    if (jump && !VALID_JUMPS.has(jump)) {
      diagnostics.push({
        lineNumber,
        columnStart: 1,
        columnEnd: inst.raw.length + 1,
        message: `Invalid jump condition '${jump}'`,
        severity: 'error',
      });
    }
  }

  return diagnostics;
}