import React from 'react';
import './DocsModal.css';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Hack Computer Reference Cheatsheet</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <section className="doc-section">
            <h3>Instruction Formats</h3>
            <p><strong>A-Instruction:</strong> <code>@value</code> (Loads a 15-bit constant or address into the A register. Range: <code>0</code> to <code>32767</code>).</p>
            <p><strong>C-Instruction:</strong> <code>dest = comp ; jump</code> (Computes an ALU expression, stores to destinations, and conditionally branches).</p>
          </section>

          <section className="doc-section">
            <h3>Predefined Symbols</h3>
            <table className="doc-table">
              <thead>
                <tr><th>Symbol</th><th>Address (RAM)</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td><code>R0 - R15</code></td><td>0 - 15</td><td>General-purpose virtual registers</td></tr>
                <tr><td><code>SP</code></td><td>0</td><td>Stack pointer</td></tr>
                <tr><td><code>LCL</code></td><td>1</td><td>Base of current local segment</td></tr>
                <tr><td><code>ARG</code></td><td>2</td><td>Base of current argument segment</td></tr>
                <tr><td><code>THIS, THAT</code></td><td>3, 4</td><td>Base of current this/that segments</td></tr>
                <tr><td><code>SCREEN</code></td><td>16384</td><td>Base of 512×256 monochrome screen memory map</td></tr>
                <tr><td><code>KBD</code></td><td>24576</td><td>Keyboard memory map</td></tr>
              </tbody>
            </table>
          </section>

          <section className="doc-section">
            <h3>C-Instruction Computations (comp)</h3>
            <div className="doc-grid">
              <div>
                <strong>When a=0 (Registers D, A):</strong>
                <ul>
                  <li><code>0</code>, <code>1</code>, <code>-1</code></li>
                  <li><code>D</code>, <code>A</code>, <code>!D</code>, <code>!A</code>, <code>-D</code>, <code>-A</code></li>
                  <li><code>D+1</code>, <code>A+1</code>, <code>D-1</code>, <code>A-1</code></li>
                  <li><code>D+A</code>, <code>D-A</code>, <code>A-D</code></li>
                  <li><code>D&A</code>, <code>D|A</code></li>
                </ul>
              </div>
              <div>
                <strong>When a=1 (Memory M = RAM[A]):</strong>
                <ul>
                  <li><code>M</code>, <code>!M</code>, <code>-M</code></li>
                  <li><code>M+1</code>, <code>M-1</code></li>
                  <li><code>D+M</code>, <code>D-M</code>, <code>M-D</code></li>
                  <li><code>D&M</code>, <code>D|M</code></li>
                </ul>
              </div>
            </div>
          </section>

          <section className="doc-section">
            <h3>Destination (dest) & Jump (jump)</h3>
            <table className="doc-table">
              <thead>
                <tr><th>dest</th><th>Target</th><th>jump</th><th>Branch Condition</th></tr>
              </thead>
              <tbody>
                <tr><td><code>M</code></td><td>RAM[A]</td><td><code>JGT</code></td><td>Jump if out &gt; 0</td></tr>
                <tr><td><code>D</code></td><td>D register</td><td><code>JEQ</code></td><td>Jump if out = 0</td></tr>
                <tr><td><code>MD</code></td><td>RAM[A] & D</td><td><code>JGE</code></td><td>Jump if out &ge; 0</td></tr>
                <tr><td><code>A</code></td><td>A register</td><td><code>JLT</code></td><td>Jump if out &lt; 0</td></tr>
                <tr><td><code>AM</code></td><td>A & RAM[A]</td><td><code>JNE</code></td><td>Jump if out &ne; 0</td></tr>
                <tr><td><code>AD</code></td><td>A & D</td><td><code>JLE</code></td><td>Jump if out &le; 0</td></tr>
                <tr><td><code>AMD</code></td><td>A, M, & D</td><td><code>JMP</code></td><td>Unconditional jump</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
};