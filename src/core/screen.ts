export const SCREEN_WIDTH = 512;
export const SCREEN_HEIGHT = 256;
export const SCREEN_START_ADDR = 16384;
export const SCREEN_END_ADDR = 24575;
export const WORDS_PER_ROW = 32;

/**
 * Renders the memory-mapped screen buffer onto an HTML5 Canvas context.
 * 
 * @param ctx The 2D rendering context of the canvas.
 * @param ram Array or typed buffer representing the 32K/64K Hack RAM.
 */
export function renderScreenMemory(
  ctx: CanvasRenderingContext2D,
  ram: Int16Array | number[]
): void {
  const imgData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
  const data = imgData.data; // 32-bit RGBA clamped array

  for (let row = 0; row < SCREEN_HEIGHT; row++) {
    for (let colWord = 0; colWord < WORDS_PER_ROW; colWord++) {
      const ramAddr = SCREEN_START_ADDR + (row * WORDS_PER_ROW) + colWord;
      const word = ram[ramAddr] || 0;

      for (let bit = 0; bit < 16; bit++) {
        // In Hack, bit 0 is the leftmost pixel of the word
        const isPixelOn = (word & (1 << bit)) !== 0;
        const pixelX = colWord * 16 + bit;
        const pixelIndex = (row * SCREEN_WIDTH + pixelX) * 4;

        // Monochrome display: Black (#111111) when ON, Light/White (#EEEEEE) when OFF
        const colorVal = isPixelOn ? 17 : 238;

        data[pixelIndex] = colorVal;     // R
        data[pixelIndex + 1] = colorVal; // G
        data[pixelIndex + 2] = colorVal; // B
        data[pixelIndex + 3] = 255;      // Alpha (fully opaque)
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}