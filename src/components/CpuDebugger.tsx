import React from 'react';
import type { CpuState } from '../core/cpu';
import './CpuDebugger.css';

interface CpuDebuggerProps {
  cpuState: CpuState;
  ram: Int16Array;
  isRunning: boolean;
  onStep: () => void;
  onRunToggle: () => void;
  onReset: () => void;
  disabled: boolean;
}

export const CpuDebugger: React.FC<CpuDebuggerProps> = ({
  cpuState,
  ram,
  isRunning,
  onStep,
  onRunToggle,
  onReset,
  disabled,
}) => {
  const currentA = cpuState.aRegister & 0x7fff;
  const currentM = ram[currentA] ?? 0;

  return (
    <div className="cpu-debugger-card">
      <div className="debugger-header">
        <h4>CPU & Registers</h4>
        <div className="debugger-actions">
          <button
            className={`btn btn-sm ${isRunning ? 'btn-warn' : 'btn-primary'}`}
            onClick={onRunToggle}
            disabled={disabled || cpuState.halted}
          >
            {isRunning ? 'Pause' : 'Run'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onStep}
            disabled={disabled || isRunning || cpuState.halted}
          >
            Step
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      <div className="registers-grid">
        <div className="reg-item">
          <span className="reg-label">PC</span>
          <span className="reg-val">{cpuState.pc}</span>
          <span className="reg-hex">0x{cpuState.pc.toString(16).padStart(4, '0').toUpperCase()}</span>
        </div>

        <div className="reg-item">
          <span className="reg-label">A</span>
          <span className="reg-val">{cpuState.aRegister}</span>
          <span className="reg-hex">0x{(cpuState.aRegister & 0xffff).toString(16).padStart(4, '0').toUpperCase()}</span>
        </div>

        <div className="reg-item">
          <span className="reg-label">D</span>
          <span className="reg-val">{cpuState.dRegister}</span>
          <span className="reg-hex">0x{(cpuState.dRegister & 0xffff).toString(16).padStart(4, '0').toUpperCase()}</span>
        </div>

        <div className="reg-item">
          <span className="reg-label">M (RAM[A])</span>
          <span className="reg-val">{currentM}</span>
          <span className="reg-hex">0x{(currentM & 0xffff).toString(16).padStart(4, '0').toUpperCase()}</span>
        </div>
      </div>

      {cpuState.halted && (
        <div className="halted-badge">Execution Halted (PC reached end of ROM)</div>
      )}
    </div>
  );
};

export default CpuDebugger;