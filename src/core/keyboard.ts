export const KBD_ADDR = 24576;

/**
 * Translates a DOM KeyboardEvent into a 16-bit Hack keycode.
 * Returns 0 if unrecognized or inactive.
 */
export function getHackKeyCode(e: KeyboardEvent): number {
  switch (e.key) {
    case 'Enter': return 128;
    case 'Backspace': return 129;
    case 'ArrowLeft': return 130;
    case 'ArrowUp': return 131;
    case 'ArrowRight': return 132;
    case 'ArrowDown': return 133;
    case 'Home': return 134;
    case 'End': return 135;
    case 'PageUp': return 136;
    case 'PageDown': return 137;
    case 'Insert': return 138;
    case 'Delete': return 139;
    case 'Escape': return 140;
    case 'F1': return 141;
    case 'F2': return 142;
    case 'F3': return 143;
    case 'F4': return 144;
    case 'F5': return 145;
    case 'F6': return 146;
    case 'F7': return 147;
    case 'F8': return 148;
    case 'F9': return 149;
    case 'F10': return 150;
    case 'F11': return 151;
    case 'F12': return 152;
    default:
      if (e.key.length === 1) {
        return e.key.charCodeAt(0);
      }
      return 0;
  }
}