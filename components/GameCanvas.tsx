import React, { useRef, useEffect, useState } from 'react';
import styles from './GameCanvas.module.css';
import {
  GRAVITY, JUMP_STRENGTH, ZULA_START_X_FRACTION, ZULA_START_Y_FRACTION, ZULA_WIDTH, ZULA_HEIGHT,
  OBSTACLE_WIDTH, OBSTACLE_GAP, OBSTACLE_SPEED, OBSTACLE_SPAWN_INTERVAL,
  MIN_OBSTACLE_HEIGHT_FRACTION, MAX_OBSTACLE_HEIGHT_FRACTION, MIN_PIPE_VISIBLE_PX
} from '../utils/physics';
import { checkRectCollision, checkBoundaryCollision, Rect } from '../utils/collision';
import { gameOverMessages } from '../utils/messages';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const jumpSoundRef = useRef<HTMLAudioElement | null>(null);
  const scoreSoundRef = useRef<HTMLAudioElement | null>(null);
  const collisionSoundRef = useRef<HTMLAudioElement | null>(null);

  const collisionOccurredRef = useRef<boolean>(false);
  const gameOverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [zulaY, setZulaY] = useState(height * ZULA_START_Y_FRACTION);
  const [velocityY, setVelocityY] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const lastObstacleSpawnTimeRef = useRef<number>(0);
  const nextObstacleIdRef = useRef<number>(0);

  const zulaX = width * ZULA_START_X_FRACTION;

  // Initialize audio
  useEffect(() => {
    // Background Music
    const bgAudio = new Audio();
    bgAudio.src = '/assets/audio/background-music.mp3';
    bgAudio.loop = true;
    bgAudio.volume = 0.5;
    bgAudio.addEventListener('canplaythrough', () => console.log('Background music can play through'));
    bgAudio.addEventListener('error', (e) => console.error('Background music error:', e));
    audioRef.current = bgAudio;
    bgAudio.load();

    // Jump Sound
    const jumpAudio = new Audio();
    jumpAudio.src = '/assets/audio/Jump 1.wav';
    jumpAudio.addEventListener('error', (e) => console.error('Jump sound error:', e));
    jumpSoundRef.current = jumpAudio;
    jumpAudio.load();

    // Score Sound
    const scoreAudio = new Audio();
    scoreAudio.src = '/assets/audio/Fruit collect 1.wav';
    scoreAudio.addEventListener('error', (e) => console.error('Score sound error:', e));
    scoreSoundRef.current = scoreAudio;
    scoreAudio.load();

    // Collision Sound
    const collisionAudio = new Audio();
    collisionAudio.src = '/assets/audio/Blow 1V2.mp3';
    collisionAudio.addEventListener('error', (e) => console.error('Collision sound error:', e));
    collisionSoundRef.current = collisionAudio;
    collisionAudio.load();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // No need to pause/nullify effect sounds here as they are short-lived
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
      }
    };
  }, []);

  // Handle audio state changes
  useEffect(() => {
    if (!audioRef.current) return;

    const playAudio = async () => {
      const audio = audioRef.current;
      if (!audio) return;

      try {
        if (gameStarted && !isGameOver && !isMuted) {
          // Reset the audio to the beginning if it's ended
          if (audio.ended) {
            audio.currentTime = 0;
          }
          await audio.play();
          console.log('Audio playback started');
        } else {
          audio.pause();
          console.log('Audio playback paused');
        }
      } catch (error) {
        console.error('Audio playback failed:', error);
      }
    };

    playAudio();
  }, [gameStarted, isGameOver, isMuted]);

  // Handle mute toggle
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const playSoundEffect = (soundType: 'jump' | 'score' | 'collision') => {
    if (isMuted) return;

    let soundToPlay: HTMLAudioElement | null = null;
    switch (soundType) {
      case 'jump':
        soundToPlay = jumpSoundRef.current;
        break;
      case 'score':
        soundToPlay = scoreSoundRef.current;
        break;
      case 'collision':
        soundToPlay = collisionSoundRef.current;
        break;
    }

    if (soundToPlay) {
      soundToPlay.currentTime = 0; // Play from the beginning
      soundToPlay.play().catch(error => console.error(`Error playing ${soundType} sound:`, error));
    }
  };

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
      collisionOccurredRef.current = false;
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
      // Select a random game over message when the game ends
      if (isGameOver) {
        const randomIndex = Math.floor(Math.random() * gameOverMessages.length);
        setGameOverMessage(gameOverMessages[randomIndex]);
      }
    }
  }, [isGameOver, gameStarted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Ensure crisp pixel rendering
    context.imageSmoothingEnabled = false;

    let animationFrameId: number;

    const drawScanlines = () => {
      if (!context) return;
      context.save();
      context.strokeStyle = 'rgba(0, 0, 0, 0.15)'; // Dark, subtle scanlines
      context.lineWidth = 1;
      for (let y = 0; y < height; y += 3) { // Adjust spacing (e.g., 3 or 4 pixels)
        context.beginPath();
        context.moveTo(0, y + 0.5); // +0.5 for sharper lines
        context.lineTo(width, y + 0.5);
        context.stroke();
      }
      context.restore();
    };

    const gameLoop = (timestamp: number) => {
      if (isGameOver) {
        renderGameOverScreen(context);
        drawScanlines();
        return;
      }

      if (!gameStarted) {
        renderStartScreen(context);
        drawScanlines();
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      
      // Solid dark blue background for a more retro feel
      context.fillStyle = '#A0C0E0'; // Lighter blue background
      context.fillRect(0, 0, width, height);

      if (!collisionOccurredRef.current) {
        setVelocityY((prevVelocityY) => prevVelocityY + GRAVITY);
        setZulaY((prevZulaY) => {
          let newY = prevZulaY + velocityY;
          // Only prevent going above the screen
          if (newY - ZULA_HEIGHT / 2 < 0) {
            newY = ZULA_HEIGHT / 2;
          }
          return newY;
        });
      }

      const zulaRect: Rect = {
        x: zulaX - ZULA_WIDTH / 2,
        y: zulaY - ZULA_HEIGHT / 2,
        width: ZULA_WIDTH,
        height: ZULA_HEIGHT,
      };

      // Check if Zula has fallen off the bottom of the screen
      if (zulaY + ZULA_HEIGHT / 2 > height && !collisionOccurredRef.current && !isGameOver) {
        collisionOccurredRef.current = true;
        playSoundEffect('collision');
        gameOverTimeoutRef.current = setTimeout(() => {
          setIsGameOver(true);
          collisionOccurredRef.current = false;
        }, 500);
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
      if (gameStarted && !isGameOver && !collisionOccurredRef.current && currentTime - lastObstacleSpawnTimeRef.current > OBSTACLE_SPAWN_INTERVAL) {
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
          let newX = obstacle.x;
          if (!collisionOccurredRef.current) {
            newX = obstacle.x - OBSTACLE_SPEED;
          }
          // Check if Zula has passed the obstacle
          if (!obstacle.scored && obstacle.x + OBSTACLE_WIDTH < zulaX && !collisionOccurredRef.current) {
            setScore(prevScore => prevScore + 1);
            playSoundEffect('score');
            return { ...obstacle, scored: true, x: newX };
          }
          return { ...obstacle, x: newX };
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

        if (!isGameOver && !collisionOccurredRef.current && (checkRectCollision(zulaRect, topObstacleRect) || checkRectCollision(zulaRect, bottomObstacleRect))) {
          collisionOccurredRef.current = true;
          playSoundEffect('collision');
          gameOverTimeoutRef.current = setTimeout(() => {
            setIsGameOver(true);
            collisionOccurredRef.current = false;
          }, 500);
        }

        if (topTowerImageRef.current) {
          context.drawImage(topTowerImageRef.current, obstacle.x, 0, OBSTACLE_WIDTH, obstacle.topHeight);
        } else {
          context.fillStyle = '#00FFFF'; // Bright Cyan for fallback obstacles
          context.fillRect(obstacle.x, 0, OBSTACLE_WIDTH, obstacle.topHeight);
        }

        if (bottomTowerImageRef.current) {
          context.drawImage(bottomTowerImageRef.current, obstacle.x, bottomTowerY, OBSTACLE_WIDTH, bottomTowerHeight);
        } else {
          context.fillStyle = '#00FFFF'; // Bright Cyan for fallback obstacles
          context.fillRect(obstacle.x, bottomTowerY, OBSTACLE_WIDTH, bottomTowerHeight);
        }
      });
      
      drawScanlines(); // Draw scanlines over the game scene

      if (!isGameOver && !collisionOccurredRef.current && checkBoundaryCollision(zulaRect, height, width)) {
        if (zulaRect.y <= 0) {
            collisionOccurredRef.current = true;
            playSoundEffect('collision');
            gameOverTimeoutRef.current = setTimeout(() => {
                setIsGameOver(true);
                collisionOccurredRef.current = false;
            }, 500);
        }
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
        collisionOccurredRef.current = false;
        if (gameOverTimeoutRef.current) {
          clearTimeout(gameOverTimeoutRef.current);
          gameOverTimeoutRef.current = null;
        }
        return;
      }

      if (!gameStarted) {
        setGameStarted(true);
      }
      setVelocityY(JUMP_STRENGTH);
      playSoundEffect('jump');
    };

    const handleMuteToggle = (event: KeyboardEvent) => {
      if (event.code === 'KeyM') {
        toggleMute();
      }
    };

    const keyboardListener = (event: Event) => handleJumpInput(event as KeyboardEvent);
    const mouseListener = (event: Event) => handleJumpInput(event as MouseEvent);
    const touchListener = (event: Event) => handleJumpInput(event as TouchEvent);
    const muteListener = (event: Event) => handleMuteToggle(event as KeyboardEvent);

    window.addEventListener('keydown', keyboardListener);
    window.addEventListener('mousedown', mouseListener);
    window.addEventListener('touchstart', touchListener);
    window.addEventListener('keydown', muteListener);

    return () => {
      window.removeEventListener('keydown', keyboardListener);
      window.removeEventListener('mousedown', mouseListener);
      window.removeEventListener('touchstart', touchListener);
      window.removeEventListener('keydown', muteListener);
    };
  }, [gameStarted, isGameOver, height]);

  // Add mute button to the game over screen
  const renderGameOverScreen = (context: CanvasRenderingContext2D) => {
    // Game Over screen background
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillRect(0, 0, width, height);

    // Message box dimensions and position
    const boxWidth = width * 0.8; // Increased width for longer messages
    const boxHeight = height * 0.5; // Increased height for message
    const boxX = (width - boxWidth) / 2;
    const boxY = (height - boxHeight) / 2;

    // Draw a border for the message box
    context.strokeStyle = 'white';
    context.lineWidth = 3;
    context.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Game Over text
    context.fillStyle = 'white';
    context.font = '32px "Press Start 2P"';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('Game Over', width / 2, boxY + boxHeight * 0.2);
    
    // Display the random game over message
    context.font = '16px "Press Start 2P"'; // Adjusted font size for message
    // Simple text wrapping
    const words = gameOverMessage.split(' ');
    let line = '';
    let messageY = boxY + boxHeight * 0.35;
    const lineHeight = 20; // Approximate line height
    const maxWidth = boxWidth - 40; // Max width for text within the box

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, width / 2, messageY);
        line = words[n] + ' ';
        messageY += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, width / 2, messageY);

    // Score text
    context.font = '24px "Press Start 2P"';
    context.fillText(`Score: ${score}`, width / 2, messageY + lineHeight * 2); // Adjusted Y position
    
    // Restart text
    context.font = '22px "Press Start 2P"';
    context.fillText('Click to Restart', width / 2, messageY + lineHeight * 3.5); // Adjusted Y position

    // Mute status
    context.font = '16px "Press Start 2P"';
    context.fillText(`Press 'M' to ${isMuted ? 'Unmute' : 'Mute'}`, width / 2, messageY + lineHeight * 5); // Adjusted Y position
  };

  // Add mute status to the start screen
  const renderStartScreen = (context: CanvasRenderingContext2D) => {
    // Solid dark blue background for a more retro feel
    context.fillStyle = '#A0C0E0'; // Lighter blue background
    context.fillRect(0, 0, width, height);

    // Draw Zula (much larger)
    const startScreenZulaWidth = ZULA_WIDTH * 2.5;  // Make Zula 2.5x larger
    const startScreenZulaHeight = ZULA_HEIGHT * 2.5;
    if (zulaImageRef.current) {
      context.drawImage(
        zulaImageRef.current,
        width / 2 - startScreenZulaWidth / 2,
        height / 2 - 180, // Position higher to accommodate larger size
        startScreenZulaWidth,
        startScreenZulaHeight
      );
    } else {
      // Fallback if image hasn't loaded
      context.fillStyle = 'black';
      context.fillRect(width / 2 - startScreenZulaWidth / 2, height / 2 - 180, startScreenZulaWidth, startScreenZulaHeight);
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText("Z", width / 2, height / 2 - 180 + startScreenZulaHeight / 2);
    }

    // Game Title
    context.fillStyle = 'white';
    context.font = '28px "Press Start 2P"';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText("ZULA'S ADVENTURE", width / 2, height / 2 + 40); // Moved down to accommodate larger Zula

    // Click to Start text
    context.font = '18px "Press Start 2P"';
    context.fillText('Click to Start', width / 2, height / 2 + 100); // Adjusted spacing

    // Mute status
    context.font = '14px "Press Start 2P"';
    context.fillText(`Press 'M' to ${isMuted ? 'Unmute' : 'Mute'}`, width / 2, height / 2 + 130); // Adjusted spacing
  };

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