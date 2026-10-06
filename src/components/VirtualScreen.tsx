import React, { useRef, useEffect } from 'react';
import { SCREEN_WIDTH, SCREEN_HEIGHT, renderScreenMemory } from '../core/screen';
import './VirtualScreen.css';

interface VirtualScreenProps {
  ram: Int16Array;
  onClearScreen?: () => void;
}

export const VirtualScreen: React.FC<VirtualScreenProps> = ({ ram, onClearScreen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderScreenMemory(ctx, ram);
  }, [ram]);

  return (
    <div className="virtual-screen-container">
      <div className="screen-header">
        <span className="screen-title">Hack Virtual Display (512 × 256)</span>
        <div className="screen-meta">
          <span className="screen-badge">RAM[16384 - 24575]</span>
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
        />
      </div>
    </div>
  );
};

export default VirtualScreen;