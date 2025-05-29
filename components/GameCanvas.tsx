import React, { useRef, useEffect, useState } from 'react';
import styles from './GameCanvas.module.css';
import {
  GRAVITY, JUMP_STRENGTH, ZULA_START_X_FRACTION, ZULA_START_Y_FRACTION, ZULA_WIDTH, ZULA_HEIGHT,
  OBSTACLE_WIDTH, OBSTACLE_GAP, OBSTACLE_SPEED, OBSTACLE_SPAWN_INTERVAL,
  MIN_OBSTACLE_HEIGHT_FRACTION, MAX_OBSTACLE_HEIGHT_FRACTION, MIN_PIPE_VISIBLE_PX
} from '../utils/physics';
import { checkRectCollision, checkBoundaryCollision, Rect } from '../utils/collision';

interface GameCanvasProps {
  width: number;
  height: number;
}

interface Obstacle {
  id: number;
  x: number;
  topHeight: number;
  scored: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zulaImageRef = useRef<HTMLImageElement | null>(null);
  const topTowerImageRef = useRef<HTMLImageElement | null>(null);
  const bottomTowerImageRef = useRef<HTMLImageElement | null>(null);

  const [zulaY, setZulaY] = useState(height * ZULA_START_Y_FRACTION);
  const [velocityY, setVelocityY] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const lastObstacleSpawnTimeRef = useRef<number>(0);
  const nextObstacleIdRef = useRef<number>(0);

  const zulaX = width * ZULA_START_X_FRACTION;

  useEffect(() => {
    const zImg = new Image();
    zImg.src = '/assets/characters/zula.png';
    zImg.onload = () => { zulaImageRef.current = zImg; };
    zImg.onerror = () => { console.error("Failed to load Zula image."); };

    const ttImg = new Image();
    ttImg.src = '/assets/towers/top-tower.png';
    ttImg.onload = () => { topTowerImageRef.current = ttImg; };
    ttImg.onerror = () => { console.error("Failed to load top tower image."); };

    const btImg = new Image();
    btImg.src = '/assets/towers/bottom-tower.png';
    btImg.onload = () => { bottomTowerImageRef.current = btImg; };
    btImg.onerror = () => { console.error("Failed to load bottom tower image."); };
  }, []);

  useEffect(() => {
    if (isGameOver || !gameStarted) {
      obstaclesRef.current = [];
      lastObstacleSpawnTimeRef.current = 0;
      nextObstacleIdRef.current = 0;
      setScore(0);
    }
  }, [isGameOver, gameStarted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (isGameOver) {
        if (context) {
            context.fillStyle = 'rgba(0, 0, 0, 0.75)';
            context.fillRect(0, 0, width, height);

            context.fillStyle = 'white';
            context.font = '32px "Press Start 2P"';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('Game Over', width / 2, height / 2 - 50);
            
            context.font = '24px "Press Start 2P"';
            context.fillText(`Score: ${score}`, width / 2, height / 2);
            
            context.font = '20px "Press Start 2P"';
            context.fillText('Click to Restart', width / 2, height / 2 + 50);
        }
        return;
      }

      if (!gameStarted) {
        if (context) {
            context.fillStyle = '#87CEEB';
            context.fillRect(0, 0, width, height);
            context.fillStyle = 'white';
            context.font = '20px "Press Start 2P"';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('Click to Start', width / 2, height / 2);
        }
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      
      context.fillStyle = '#87CEEB';
      context.fillRect(0, 0, width, height);

      setVelocityY((prevVelocityY) => prevVelocityY + GRAVITY);
      setZulaY((prevZulaY) => {
        let newY = prevZulaY + velocityY;
        // Only prevent going above the screen
        if (newY - ZULA_HEIGHT / 2 < 0) {
          newY = ZULA_HEIGHT / 2;
        }
        return newY;
      });

      const zulaRect: Rect = {
        x: zulaX - ZULA_WIDTH / 2,
        y: zulaY - ZULA_HEIGHT / 2,
        width: ZULA_WIDTH,
        height: ZULA_HEIGHT,
      };

      // Check if Zula has fallen off the bottom of the screen
      if (zulaY + ZULA_HEIGHT / 2 > height) {
        setIsGameOver(true);
        return;
      }

      if (zulaImageRef.current) {
        context.drawImage(zulaImageRef.current, zulaX - ZULA_WIDTH / 2, zulaY - ZULA_HEIGHT / 2, ZULA_WIDTH, ZULA_HEIGHT);
      } else {
        context.fillStyle = 'black';
        context.fillRect(zulaX - ZULA_WIDTH / 2, zulaY - ZULA_HEIGHT / 2, ZULA_WIDTH, ZULA_HEIGHT);
        context.fillStyle = 'white'; context.textAlign = 'center'; context.textBaseline = 'middle';
        context.fillText("Z", zulaX, zulaY);
      }

      // Draw score during gameplay
      context.fillStyle = 'white';
      context.font = '24px "Press Start 2P"';
      context.textAlign = 'center';
      context.textBaseline = 'top';
      context.fillText(score.toString(), width / 2, 20);

      const currentTime = timestamp;
      if (gameStarted && !isGameOver && currentTime - lastObstacleSpawnTimeRef.current > OBSTACLE_SPAWN_INTERVAL) {
        if (lastObstacleSpawnTimeRef.current === 0 && gameStarted) {
             lastObstacleSpawnTimeRef.current = currentTime - OBSTACLE_SPAWN_INTERVAL -1;
        }
        if (obstaclesRef.current.length === 0 || currentTime - lastObstacleSpawnTimeRef.current > OBSTACLE_SPAWN_INTERVAL) {
            const maxPossibleTopHeight = height - OBSTACLE_GAP - MIN_PIPE_VISIBLE_PX;
            const minAllowedTopHeight = MIN_PIPE_VISIBLE_PX;
            let calculatedMinTop = height * MIN_OBSTACLE_HEIGHT_FRACTION;
            let calculatedMaxTop = height * MAX_OBSTACLE_HEIGHT_FRACTION;
            calculatedMinTop = Math.max(minAllowedTopHeight, calculatedMinTop);
            calculatedMaxTop = Math.min(maxPossibleTopHeight, calculatedMaxTop);
            if (calculatedMinTop >= calculatedMaxTop) {
                calculatedMinTop = minAllowedTopHeight;
                calculatedMaxTop = maxPossibleTopHeight; 
                if (calculatedMinTop >= calculatedMaxTop) {
                    calculatedMinTop = MIN_PIPE_VISIBLE_PX;
                    calculatedMaxTop = height - OBSTACLE_GAP - MIN_PIPE_VISIBLE_PX; 
                    if(calculatedMaxTop < calculatedMinTop) calculatedMaxTop = calculatedMinTop + MIN_PIPE_VISIBLE_PX;
                }
            }
            const randomTopHeight = Math.random() * (calculatedMaxTop - calculatedMinTop) + calculatedMinTop;
            obstaclesRef.current = [
              ...obstaclesRef.current,
              {
                id: nextObstacleIdRef.current++,
                x: width,
                topHeight: randomTopHeight,
                scored: false
              }
            ];
            lastObstacleSpawnTimeRef.current = currentTime;
        }
      }
      
      obstaclesRef.current = obstaclesRef.current
        .map(obstacle => {
          // Check if Zula has passed the obstacle
          if (!obstacle.scored && obstacle.x + OBSTACLE_WIDTH < zulaX) {
            setScore(prevScore => prevScore + 1);
            return { ...obstacle, scored: true, x: obstacle.x - OBSTACLE_SPEED };
          }
          return { ...obstacle, x: obstacle.x - OBSTACLE_SPEED };
        })
        .filter(obstacle => obstacle.x + OBSTACLE_WIDTH > 0);

      obstaclesRef.current.forEach(obstacle => {
        const bottomTowerY = obstacle.topHeight + OBSTACLE_GAP;
        const bottomTowerHeight = height - bottomTowerY;

        const topObstacleRect: Rect = {
          x: obstacle.x,
          y: 0,
          width: OBSTACLE_WIDTH,
          height: obstacle.topHeight,
        };
        const bottomObstacleRect: Rect = {
          x: obstacle.x,
          y: bottomTowerY,
          width: OBSTACLE_WIDTH,
          height: bottomTowerHeight,
        };

        if (checkRectCollision(zulaRect, topObstacleRect) || checkRectCollision(zulaRect, bottomObstacleRect)) {
          setIsGameOver(true);
          return;
        }

        if (topTowerImageRef.current) {
          context.drawImage(topTowerImageRef.current, obstacle.x, 0, OBSTACLE_WIDTH, obstacle.topHeight);
        } else {
          context.fillStyle = 'green';
          context.fillRect(obstacle.x, 0, OBSTACLE_WIDTH, obstacle.topHeight);
        }

        if (bottomTowerImageRef.current) {
          context.drawImage(bottomTowerImageRef.current, obstacle.x, bottomTowerY, OBSTACLE_WIDTH, bottomTowerHeight);
        } else {
          context.fillStyle = 'green';
          context.fillRect(obstacle.x, bottomTowerY, OBSTACLE_WIDTH, bottomTowerHeight);
        }
      });
      
      if (checkBoundaryCollision(zulaRect, height, width)) {
        setIsGameOver(true);
        return;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    if (gameStarted && !isGameOver && lastObstacleSpawnTimeRef.current === 0) {
        lastObstacleSpawnTimeRef.current = performance.now();
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, isGameOver, width, height, zulaX, zulaY, velocityY]);

  useEffect(() => {
    const handleJumpInput = (event: KeyboardEvent | MouseEvent | TouchEvent) => {
      if (event instanceof KeyboardEvent && event.code !== 'Space') return;
      event.preventDefault();

      if (isGameOver) {
        setZulaY(height * ZULA_START_Y_FRACTION);
        setVelocityY(0);
        setIsGameOver(false);
        setGameStarted(true);
        return;
      }

      if (!gameStarted) {
        setGameStarted(true);
      }
      setVelocityY(JUMP_STRENGTH);
    };

    const keyboardListener = (event: Event) => handleJumpInput(event as KeyboardEvent);
    const mouseListener = (event: Event) => handleJumpInput(event as MouseEvent);
    const touchListener = (event: Event) => handleJumpInput(event as TouchEvent);

    window.addEventListener('keydown', keyboardListener);
    window.addEventListener('mousedown', mouseListener);
    window.addEventListener('touchstart', touchListener);

    return () => {
      window.removeEventListener('keydown', keyboardListener);
      window.removeEventListener('mousedown', mouseListener);
      window.removeEventListener('touchstart', touchListener);
    };
  }, [gameStarted, isGameOver, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={styles.gameCanvas}
      tabIndex={0}
    />
  );
};

export default GameCanvas; 