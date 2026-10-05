export interface HackExample {
  id: string;
  name: string;
  filename: string;
  description: string;
  code: string;
}

export const PRELOADED_EXAMPLES: HackExample[] = [
  {
    id: 'default',
    name: 'Simple Arithmetic (Default)',
    filename: 'default.asm',
    description: 'Basic arithmetic demonstrating A-instructions and C-instructions.',
    code: `// Example Hack Assembly Program
@2
D=A
@3
D=D+A
@0
M=D
(INFINITE_LOOP)
@INFINITE_LOOP
0;JMP
`,
  },
  {
    id: 'add',
    name: 'Add.asm (Nand2Tetris Benchmark)',
    filename: 'Add.asm',
    description: 'Computes R0 = 2 + 3 using RAM and register operations.',
    code: `// Computes R0 = 2 + 3
// (R0 refers to RAM[0])

@2
D=A
@3
D=D+A
@0
M=D
`,
  },
  {
    id: 'max',
    name: 'Max.asm (Branching & Comparison)',
    filename: 'Max.asm',
    description: 'Computes R2 = max(R0, R1) using conditional jumps.',
    code: `// Computes R2 = max(R0, R1)
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2])

   @R0
   D=M              // D = first number
   @R1
   D=D-M            // D = first number - second number
   @OUTPUT_FIRST
   D;JGT            // If D>0 (first is greater) goto output_first
   @R1
   D=M              // D = second number
   @OUTPUT_D
   0;JMP            // Goto output_d
(OUTPUT_FIRST)
   @R0
   D=M              // D = first number
(OUTPUT_D)
   @R2
   M=D              // M[2] = max(first, second)
(INFINITE_LOOP)
   @INFINITE_LOOP
   0;JMP            // Infinite loop to terminate
`,
  },
  {
    id: 'rectangle',
    name: 'Rectangle.asm (Screen I/O)',
    filename: 'Rectangle.asm',
    description: 'Draws a filled rectangle of width 16 pixels and height R0 on the screen.',
    code: `// Draws a filled rectangle of 16 pixels width and R0 rows height at the top-left of the screen.

   @R0
   D=M
   @INFINITE_LOOP
   D;JLE            // If height <= 0 goto INFINITE_LOOP

   @counter
   M=D              // counter = R0
   @SCREEN
   D=A
   @address
   M=D              // address = 16384 (base address of Hack screen memory)

(LOOP)
   @address
   A=M
   M=-1             // Draw 16 black pixels: RAM[address] = -1 (1111111111111111)

   @address
   D=M
   @32
   D=D+A
   @address
   M=D              // address = address + 32 (next row in screen memory)

   @counter
   MD=M-1           // counter = counter - 1
   @LOOP
   D;JGT            // If counter > 0 goto LOOP

(INFINITE_LOOP)
   @INFINITE_LOOP
   0;JMP            // Infinite loop
`,
  },
];