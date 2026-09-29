import type { ParsedInstruction } from '../types/hack';

export class SymbolTable {
  private symbols: Map<string, number>;
  private nextVariableAddress: number;

  constructor() {
    this.symbols = new Map<string, number>();
    this.nextVariableAddress = 16;
    this.initializePredefinedSymbols();
  }

  private initializePredefinedSymbols(): void {
    // Virtual registers R0 - R15
    for (let i = 0; i <= 15; i++) {
      this.symbols.set(`R${i}`, i);
    }

    // Standard memory-mapped I/O and pointers
    this.symbols.set('SP', 0);
    this.symbols.set('LCL', 1);
    this.symbols.set('ARG', 2);
    this.symbols.set('THIS', 3);
    this.symbols.set('THAT', 4);
    this.symbols.set('SCREEN', 16384);
    this.symbols.set('KBD', 24576);
  }

  public addEntry(symbol: string, address: number): void {
    this.symbols.set(symbol, address);
  }

  public contains(symbol: string): boolean {
    return this.symbols.has(symbol);
  }

  public getAddress(symbol: string): number | undefined {
    return this.symbols.get(symbol);
  }

  /**
   * Resolves a variable symbol. If not present, allocates next free RAM slot (16+).
   */
  public resolveOrAllocateVariable(symbol: string): number {
    if (this.contains(symbol)) {
      return this.getAddress(symbol)!;
    }
    const allocatedAddress = this.nextVariableAddress++;
    this.addEntry(symbol, allocatedAddress);
    return allocatedAddress;
  }
}

/**
 * First pass of the two-pass assembler:
 * Scans instructions to record ROM line numbers for labels (LABEL).
 */
export function buildLabelSymbolTable(instructions: ParsedInstruction[]): {
  symbolTable: SymbolTable;
  executableInstructions: ParsedInstruction[];
} {
  const symbolTable = new SymbolTable();
  const executableInstructions: ParsedInstruction[] = [];
  let romAddress = 0;

  for (const inst of instructions) {
    if (inst.type === 'LABEL') {
      symbolTable.addEntry(inst.label, romAddress);
    } else {
      executableInstructions.push(inst);
      romAddress++;
    }
  }

  return { symbolTable, executableInstructions };
}