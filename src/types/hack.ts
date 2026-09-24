export type InstructionType = 'A_INSTRUCTION' | 'C_INSTRUCTION' | 'LABEL';

export interface BaseInstruction {
  raw: string;
  lineNumber: number;
  romAddress?: number;
}

export interface AInstruction extends BaseInstruction {
  type: 'A_INSTRUCTION';
  value: string;
  isSymbol: boolean;
  numericValue?: number;
}

export interface CInstruction extends BaseInstruction {
  type: 'C_INSTRUCTION';
  dest?: string;
  comp: string;
  jump?: string;
}

export interface LabelDeclaration extends BaseInstruction {
  type: 'LABEL';
  label: string;
}

export type ParsedInstruction = AInstruction | CInstruction | LabelDeclaration;

export interface DiagnosticError {
  lineNumber: number;
  columnStart: number;
  columnEnd: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface AssemblerResult {
  diagnostics: DiagnosticError[];
  binaryLines: string[];
  symbolTableSnapshot: Record<string, number>;
}