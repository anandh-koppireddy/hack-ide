export interface HackExample {
  id: string;
  name: string;
  filename: string;
  code: string;
  expectedBinary?: string[];
}

export const PRELOADED_EXAMPLES: HackExample[] = [
  {
    id: 'add',
    name: 'Add.asm (Basic Arithmetic)',
    filename: 'Add.asm',
    code: `// Computes R0 = 2 + 3
@2
D=A
@3
D=D+A
@0
M=D`,
    expectedBinary: [
      '0000000000000010',
      '1110110000010000',
      '0000000000000011',
      '1110000010010000',
      '0000000000000000',
      '1110001100001000'
    ]
  },
  {
    id: 'max',
    name: 'Max.asm (Conditional Branching)',
    filename: 'Max.asm',
    code: `// Computes R2 = max(R0, R1)
   @R0
   D=M
   @R1
   D=D-M
   @OUTPUT_FIRST
   D;JGT
   @R1
   D=M
   @OUTPUT_D
   0;JMP
(OUTPUT_FIRST)
   @R0
   D=M
(OUTPUT_D)
   @R2
   M=D
(INFINITE_LOOP)
   @INFINITE_LOOP
   0;JMP`,
    expectedBinary: [
      '0000000000000000',
      '1111110000010000',
      '0000000000000001',
      '1111010011010000',
      '0000000000001010',
      '1110001100000001',
      '0000000000000001',
      '1111110000010000',
      '0000000000001100',
      '1110101010000111',
      '0000000000000000',
      '1111110000010000',
      '0000000000000010',
      '1110001100001000',
      '0000000000001110',
      '1110101010000111'
    ]
  },
  {
    id: 'rect',
    name: 'Rectangle.asm (Loop & Memory)',
    filename: 'Rectangle.asm',
    code: `// Draws a 16-pixel-wide rectangle of height R0 on the screen
   @R0
   D=M
   @INFINITE_LOOP
   D;JLE
   @counter
   M=D
   @SCREEN
   D=A
   @address
   M=D
(LOOP)
   @address
   A=M
   M=-1
   @address
   D=M
   @32
   D=D+A
   @address
   M=D
   @counter
   MD=M-1
   @LOOP
   D;JGT
(INFINITE_LOOP)
   @INFINITE_LOOP
   0;JMP`,
    expectedBinary: [
      '0000000000000000', // @R0
      '1111110000010000', // D=M
      '0000000000010111', // @INFINITE_LOOP (ROM[23])
      '1110001100000110', // D;JLE
      '0000000000010000', // @counter (RAM[16])
      '1110001100001000', // M=D
      '0100000000000000', // @SCREEN (16384)
      '1110110000010000', // D=A
      '0000000000010001', // @address (RAM[17])
      '1110001100001000', // M=D
      '0000000000010001', // @address
      '1111110000100000', // A=M
      '1110111010001000', // M=-1
      '0000000000010001', // @address
      '1111110000010000', // D=M
      '0000000000100000', // @32
      '1110000010010000', // D=D+A
      '0000000000010001', // @address
      '1110001100001000', // M=D
      '0000000000010000', // @counter
      '1111110010011000', // MD=M-1
      '0000000000001010', // @LOOP (ROM[10])
      '1110001100000001', // D;JGT
      '0000000000010111', // @INFINITE_LOOP (ROM[23])
      '1110101010000111'  // 0;JMP
    ]
  }
];