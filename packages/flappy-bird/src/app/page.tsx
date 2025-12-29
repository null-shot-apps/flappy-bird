'use client';

import { useEffect, useRef, useState } from 'react';

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    // Load best score from localStorage
    const saved = localStorage.getItem('flappyBestScore');
    if (saved) setBestScore(parseInt(saved));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 600;

    // Game variables
    const bird = {
      x: 80,
      y: 300,
      radius: 15,
      velocity: 0,
      gravity: 0.5,
      flapPower: -9
    };

    const pipes: Array<{ x: number; gapY: number; passed: boolean }> = [];
    const pipeWidth = 60;
    const pipeGap = 150;
    const pipeSpeed = 2.5;
    let frameCount = 0;
    let animationId: number;
    let currentScore = 0;

    const resetGame = () => {
      bird.y = 300;
      bird.velocity = 0;
      pipes.length = 0;
      frameCount = 0;
      currentScore = 0;
      setScore(0);
    };

    const flap = () => {
      if (gameState === 'start') {
        setGameState('playing');
        resetGame();
      }
      if (gameState === 'playing') {
        bird.velocity = bird.flapPower;
      }
    };

    const checkCollision = () => {
      // Ground collision
      if (bird.y + bird.radius > canvas.height) return true;
      // Ceiling collision
      if (bird.y - bird.radius < 0) return true;

      // Pipe collision
      for (const pipe of pipes) {
        if (
          bird.x + bird.radius > pipe.x &&
          bird.x - bird.radius < pipe.x + pipeWidth
        ) {
          if (
            bird.y - bird.radius < pipe.gapY ||
            bird.y + bird.radius > pipe.gapY + pipeGap
          ) {
            return true;
          }
        }
      }
      return false;
    };

    const gameLoop = () => {
      if (gameState !== 'playing') return;

      // Clear canvas
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update bird
      bird.velocity += bird.gravity;
      bird.y += bird.velocity;

      // Spawn pipes
      if (frameCount % 90 === 0) {
        const gapY = Math.random() * (canvas.height - pipeGap - 100) + 50;
        pipes.push({ x: canvas.width, gapY, passed: false });
      }

      // Update and draw pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= pipeSpeed;

        // Draw top pipe
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY);

        // Draw bottom pipe
        ctx.fillRect(
          pipe.x,
          pipe.gapY + pipeGap,
          pipeWidth,
          canvas.height - pipe.gapY - pipeGap
        );

        // Score when passing pipe
        if (!pipe.passed && bird.x > pipe.x + pipeWidth) {
          pipe.passed = true;
          currentScore++;
          setScore(currentScore);
        }

        // Remove off-screen pipes
        if (pipe.x + pipeWidth < 0) {
          pipes.splice(i, 1);
        }
      }

      // Draw bird
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw ground
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

      // Check collision
      if (checkCollision()) {
        setGameState('gameover');
        if (currentScore > bestScore) {
          setBestScore(currentScore);
          localStorage.setItem('flappyBestScore', currentScore.toString());
        }
        return;
      }

      frameCount++;
      animationId = requestAnimationFrame(gameLoop);
    };

    // Event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        flap();
      }
    };

    const handleClick = () => {
      flap();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleClick);

    if (gameState === 'playing') {
      gameLoop();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleClick);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [gameState, bestScore]);

  const handleRestart = () => {
    setGameState('start');
  };

  return (
    <div className="relative h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-600">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border-4 border-white rounded-lg shadow-2xl"
        />
        
        {/* Score Display */}
        {gameState === 'playing' && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white text-5xl font-bold drop-shadow-lg">
            {score}
          </div>
        )}

        {/* Start Screen */}
        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
            <h1 className="text-white text-5xl font-bold mb-4">Flappy Bird</h1>
            <p className="text-white text-2xl mb-2">Tap to Start</p>
            <p className="text-white/80 text-sm">Spacebar or Click to Flap</p>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <h2 className="text-white text-5xl font-bold mb-6">Game Over</h2>
            <div className="text-white text-2xl mb-2">Score: {score}</div>
            <div className="text-yellow-300 text-xl mb-8">Best: {bestScore}</div>
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-lg transition-colors"
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

