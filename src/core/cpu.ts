export interface CpuState {
  aRegister: number;     // 16-bit (0 - 65535 or signed -32768 to 32767)
  dRegister: number;     // 16-bit
  pc: number;            // 15-bit Program Counter (0 - 32767)
  halted: boolean;       // Set if PC is out of ROM bounds
}

export function createInitialCpuState(): CpuState {
  return {
    aRegister: 0,
    dRegister: 0,
    pc: 0,
    halted: false,
  };
}

/**
 * Normalizes any number to a signed 16-bit integer (-32768 to 32767).
 */
export function toInt16(n: number): number {
  const int16 = n & 0xffff;
  return int16 >= 0x8000 ? int16 - 0x10000 : int16;
}

/**
 * Evaluates Hack ALU computation for the 6 control bits (c1..c6).
 * 
 * @param compBits 6-bit string (e.g. "101010" for 0, "001100" for D)
 * @param x D register value
 * @param y A register or M (RAM[A]) value
 */
export function computeAlu(compBits: string, x: number, y: number): number {
  let result = 0;

  switch (compBits) {
    case '101010': result = 0; break;
    case '111111': result = 1; break;
    case '111010': result = -1; break;
    case '001100': result = x; break;
    case '110000': result = y; break;
    case '001101': result = ~x; break;
    case '110001': result = ~y; break;
    case '001111': result = -x; break;
    case '110011': result = -y; break;
    case '011111': result = x + 1; break;
    case '110111': result = y + 1; break;
    case '001110': result = x - 1; break;
    case '110010': result = y - 1; break;
    case '000010': result = x + y; break;
    case '010011': result = x - y; break;
    case '000111': result = y - x; break;
    case '000000': result = x & y; break;
    case '010101': result = x | y; break;
    default: result = 0; break;
  }

  return toInt16(result);
}

/**
 * Checks whether the jump condition is satisfied based on ALU output and 3 jump bits.
 */
function shouldJump(jumpBits: string, out: number): boolean {
  const isZero = out === 0;
  const isNeg = out < 0;
  const isPos = out > 0;

  switch (jumpBits) {
    case '000': return false;              // null
    case '001': return isPos;              // JGT
    case '010': return isZero;             // JEQ
    case '011': return isPos || isZero;     // JGE
    case '100': return isNeg;              // JLT
    case '101': return !isZero;            // JNE
    case '110': return isNeg || isZero;     // JLE
    case '111': return true;               // JMP
    default: return false;
  }
}

/**
 * Executes a single CPU cycle.
 * Mutates `ram` directly for performance.
 * Returns an updated, immutable `CpuState`.
 */
export function stepCpu(
  cpu: CpuState,
  rom: string[],
  ram: Int16Array
): CpuState {
  if (cpu.pc < 0 || cpu.pc >= rom.length) {
    return { ...cpu, halted: true };
  }

  const instruction = rom[cpu.pc];
  if (!instruction || instruction.length !== 16) {
    return { ...cpu, halted: true };
  }

  // --- A-Instruction: 0vvv vvvv vvvv vvvv ---
  if (instruction.startsWith('0')) {
    const value = parseInt(instruction.substring(1), 2);
    return {
      aRegister: value,
      dRegister: cpu.dRegister,
      pc: (cpu.pc + 1) & 0x7fff,
      halted: false,
    };
  }

  // --- C-Instruction: 111 a cccccc ddd jjj ---
  const aBit = instruction[3];
  const compBits = instruction.substring(4, 10);
  const destBits = instruction.substring(10, 13);
  const jumpBits = instruction.substring(13, 16);

  const aVal = cpu.aRegister & 0x7fff;
  const mVal = ram[aVal] || 0;
  const yVal = aBit === '1' ? mVal : cpu.aRegister;

  // Compute ALU output
  const aluOut = computeAlu(compBits, cpu.dRegister, yVal);

  // Determine destinations
  const destA = destBits[0] === '1';
  const destD = destBits[1] === '1';
  const destM = destBits[2] === '1';

  let nextA = cpu.aRegister;
  let nextD = cpu.dRegister;

  if (destM) {
    ram[aVal] = aluOut;
  }
  if (destA) {
    nextA = aluOut;
  }
  if (destD) {
    nextD = aluOut;
  }

  // Determine next PC
  const jump = shouldJump(jumpBits, aluOut);
  const nextPc = jump ? (cpu.aRegister & 0x7fff) : (cpu.pc + 1) & 0x7fff;

  return {
    aRegister: nextA,
    dRegister: nextD,
    pc: nextPc,
    halted: nextPc >= rom.length,
  };
}