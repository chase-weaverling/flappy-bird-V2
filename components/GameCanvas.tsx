import React, { useRef, useEffect } from 'react';
import styles from './GameCanvas.module.css';

interface GameCanvasProps {
  width: number;
  height: number;
  // We can add more props later, like a callback for when the canvas is ready
}

const GameCanvas: React.FC<GameCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // We'll draw on the canvas in later steps
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Example: Fill background to test
    context.fillStyle = '#87CEEB'; // Sky blue
    context.fillRect(0, 0, width, height);

  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={styles.gameCanvas}
    />
  );
};

export default GameCanvas; 