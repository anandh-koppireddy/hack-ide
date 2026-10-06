import React, { useRef, useEffect } from 'react';
import { SCREEN_WIDTH, SCREEN_HEIGHT, renderScreenMemory } from '../core/screen';
import { KBD_ADDR } from '../core/keyboard';
import './VirtualScreen.css';

interface VirtualScreenProps {
  ram: Int16Array;
  renderTrigger?: number;
  onClearScreen?: () => void;
}

export const VirtualScreen: React.FC<VirtualScreenProps> = ({ ram, renderTrigger, onClearScreen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentKey = ram[KBD_ADDR] || 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderScreenMemory(ctx, ram);
  }, [ram, renderTrigger]);

  const renderKeyDisplay = () => {
    if (currentKey === 0) return 'None';
    if (currentKey >= 32 && currentKey <= 126) {
      return `'${String.fromCharCode(currentKey)}' (${currentKey})`;
    }
    return `Code ${currentKey}`;
  };

  return (
    <div className="virtual-screen-container">
      <div className="screen-header">
        <span className="screen-title">Hack Virtual Display (512 × 256)</span>
        <div className="screen-meta">
          <span className="screen-badge" title="Memory-mapped Screen">
            RAM[16384 - 24575]
          </span>
          <span
            className={`kbd-badge ${currentKey !== 0 ? 'active' : ''}`}
            title="Memory-mapped Keyboard"
          >
            KBD: {renderKeyDisplay()}
          </span>
          {onClearScreen && (
            <button className="btn btn-secondary btn-sm" onClick={onClearScreen}>
              Clear Screen
            </button>
          )}
        </div>
      </div>
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          className="hack-canvas"
          tabIndex={0}
          title="Click to focus virtual display for keyboard input"
        />
      </div>
    </div>
  );
};

export default VirtualScreen;