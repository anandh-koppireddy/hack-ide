import type { ParsedInstruction } from '../types/hack';

export class SymbolTable {
  public symbols: Record<string, number>;
  public nextVariableAddress: number = 16;

  constructor() {
    this.symbols = {
      SP: 0,
      LCL: 1,
      ARG: 2,
      THIS: 3,
      THAT: 4,
      SCREEN: 16384,
      KBD: 24576,
      R0: 0,
      R1: 1,
      R2: 2,
      R3: 3,
      R4: 4,
      R5: 5,
      R6: 6,
      R7: 7,
      R8: 8,
      R9: 9,
      R10: 10,
      R11: 11,
      R12: 12,
      R13: 13,
      R14: 14,
      R15: 15,
    };
  }

  public addEntry(symbol: string, address: number): void {
    this.symbols[symbol] = address;
  }

  public contains(symbol: string): boolean {
    return symbol in this.symbols;
  }

  public getAddress(symbol: string): number {
    return this.symbols[symbol];
  }

  public getOrAllocateVariable(symbol: string): number {
    if (!this.contains(symbol)) {
      this.symbols[symbol] = this.nextVariableAddress++;
    }
    return this.symbols[symbol];
  }

  public getTable(): Record<string, number> {
    return { ...this.symbols };
  }
}

export function buildLabelSymbolTable(instructions: ParsedInstruction[]): SymbolTable {
  const table = new SymbolTable();
  let romAddress = 0;

  for (const inst of instructions) {
    const raw = inst as any;
    
    // Check all common enum / type names for labels
    const isLabel = 
      raw.type === 'L_INSTRUCTION' || 
      raw.type === 'LABEL' || 
      raw.instructionType === 'L_COMMAND' ||
      raw.instructionType === 'L_INSTRUCTION' ||
      raw.isLabel === true ||
      Boolean(raw.label);

    if (isLabel) {
      // Extract label name (strip parentheses if present)
      const rawName = raw.symbol ?? raw.label ?? raw.name ?? raw.value;
      if (typeof rawName === 'string') {
        const cleanName = rawName.replace(/[()]/g, '').trim();
        if (cleanName) {
          table.addEntry(cleanName, romAddress);
        }
      }
    } else {
      // Only advance ROM address for actual executable instructions (A and C)
      romAddress++;
    }
  }

  return table;
}