'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { generateMaze, solveMaze, Maze, Cell, MAZE_SIZES, Difficulty } from '@/lib/maze';

interface MazeGameProps {
  difficulty: Difficulty;
}

const CELL_SIZE = 20;
const WALL_THICKNESS = 2;
const PLAYER_COLOR = '#3b82f6'; // blue-500
const GOAL_COLOR = '#ef4444'; // red-500
const PATH_COLOR = 'rgba(234, 179, 8, 0.5)'; // yellow-500 with opacity
const VISITED_COLOR = '#ffffff';
const UNVISITED_COLOR = '#000000'; // Dark mode background
const WALL_COLOR = '#374151'; // gray-700

export default function MazeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [maze, setMaze] = useState<Maze | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [goalPos, setGoalPos] = useState({ x: 0, y: 0 });
  const [path, setPath] = useState<{ x: number; y: number }[]>([]);
  const [showPath, setShowPath] = useState(false);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');

  // 使用 ref 来存储最新的状态，避免 useEffect 频繁重新绑定
  const playerPosRef = useRef(playerPos);
  const mazeRef = useRef(maze);
  const gameStatusRef = useRef(gameStatus);
  const goalPosRef = useRef(goalPos);
  
  // 触摸相关状态
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { mazeRef.current = maze; }, [maze]);
  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);
  useEffect(() => { goalPosRef.current = goalPos; }, [goalPos]);
  const [steps, setSteps] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 初始化游戏
  const initGame = useCallback(() => {
    const { rows, cols } = MAZE_SIZES[difficulty];
    const newMaze = generateMaze(rows, cols);
    setMaze(newMaze);
    setPlayerPos({ x: 0, y: 0 });
    setGoalPos({ x: cols - 1, y: rows - 1 });
    setPath([]);
    setShowPath(false);
    setGameStatus('playing');
    setSteps(0);
    setStartTime(Date.now());
    setElapsedTime(0);
  }, [difficulty]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStatus === 'playing' && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, startTime]);

  // 移动逻辑
  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameStatusRef.current !== 'playing' || !mazeRef.current) return;

    const { x, y } = playerPosRef.current;
    const currentCell = mazeRef.current[y][x];
    let newX = x;
    let newY = y;

    switch (direction) {
      case 'up':
        if (!currentCell.walls.top) newY--;
        break;
      case 'right':
        if (!currentCell.walls.right) newX++;
        break;
      case 'down':
        if (!currentCell.walls.bottom) newY++;
        break;
      case 'left':
        if (!currentCell.walls.left) newX--;
        break;
    }

    if (newX !== x || newY !== y) {
      setPlayerPos({ x: newX, y: newY });
      setSteps(s => s + 1);
      
      // 检查是否到达终点
      if (newX === goalPosRef.current.x && newY === goalPosRef.current.y) {
        setGameStatus('won');
      }
    }
  }, []);

  // 处理键盘输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 防止方向键滚动页面
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          move('up');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          move('right');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          move('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          move('left');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // 处理触摸输入 (滑动)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // 防止默认滚动
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };

      const dx = touchEnd.x - touchStartRef.current.x;
      const dy = touchEnd.y - touchStartRef.current.y;
      
      // 最小滑动距离
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        // 水平滑动
        if (dx > 0) move('right');
        else move('left');
      } else {
        // 垂直滑动
        if (dy > 0) move('down');
        else move('up');
      }

      touchStartRef.current = null;
    };

    // 使用 passive: false 来允许 preventDefault
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [move]);

  // 渲染迷宫
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !maze) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { rows, cols } = MAZE_SIZES[difficulty];
    canvas.width = cols * CELL_SIZE;
    canvas.height = rows * CELL_SIZE;

    // 清除画布
    ctx.fillStyle = UNVISITED_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制迷宫
    maze.forEach(row => {
      row.forEach(cell => {
        const x = cell.x * CELL_SIZE;
        const y = cell.y * CELL_SIZE;

        // 绘制地板 (可选，这里假设所有都是通路)
        ctx.fillStyle = VISITED_COLOR;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        // 绘制墙壁
        ctx.fillStyle = WALL_COLOR;
        
        if (cell.walls.top) {
          ctx.fillRect(x, y, CELL_SIZE, WALL_THICKNESS);
        }
        if (cell.walls.right) {
          ctx.fillRect(x + CELL_SIZE - WALL_THICKNESS, y, WALL_THICKNESS, CELL_SIZE);
        }
        if (cell.walls.bottom) {
          ctx.fillRect(x, y + CELL_SIZE - WALL_THICKNESS, CELL_SIZE, WALL_THICKNESS);
        }
        if (cell.walls.left) {
          ctx.fillRect(x, y, WALL_THICKNESS, CELL_SIZE);
        }
      });
    });

    // 绘制提示路径
    if (showPath && path.length > 0) {
      ctx.fillStyle = PATH_COLOR;
      path.forEach(pos => {
        ctx.fillRect(
          pos.x * CELL_SIZE + WALL_THICKNESS, 
          pos.y * CELL_SIZE + WALL_THICKNESS, 
          CELL_SIZE - 2 * WALL_THICKNESS, 
          CELL_SIZE - 2 * WALL_THICKNESS
        );
      });
    }

    // 绘制终点
    ctx.fillStyle = GOAL_COLOR;
    ctx.fillRect(
      goalPos.x * CELL_SIZE + 4,
      goalPos.y * CELL_SIZE + 4,
      CELL_SIZE - 8,
      CELL_SIZE - 8
    );

    // 绘制玩家
    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(
      playerPos.x * CELL_SIZE + CELL_SIZE / 2,
      playerPos.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // 绘制战争迷雾
    if (fogEnabled && gameStatus === 'playing') {
      const gradient = ctx.createRadialGradient(
        playerPos.x * CELL_SIZE + CELL_SIZE / 2,
        playerPos.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE * 2,
        playerPos.x * CELL_SIZE + CELL_SIZE / 2,
        playerPos.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE * 5
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 完全遮挡远处
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.arc(
        playerPos.x * CELL_SIZE + CELL_SIZE / 2,
        playerPos.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE * 5,
        0,
        Math.PI * 2,
        true
      );
      ctx.fillStyle = 'black';
      ctx.fill();
    }

  }, [maze, playerPos, goalPos, difficulty, showPath, path, fogEnabled, gameStatus]);

  // 处理提示
  const handleHint = () => {
    if (!maze) return;
    const solution = solveMaze(maze, playerPos, goalPos);
    setPath(solution);
    setShowPath(true);
    // 提示惩罚? 或者只是显示几秒钟
    setTimeout(() => setShowPath(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="mb-4 flex gap-4 items-center flex-wrap justify-center">
        <select 
          value={difficulty} 
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
          <option value="extreme">极限</option>
        </select>
        
        <button 
          onClick={initGame}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          新游戏
        </button>

        <button 
          onClick={handleHint}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          提示
        </button>

        <button
          onClick={() => setFogEnabled(!fogEnabled)}
          className={`px-4 py-2 rounded transition-colors ${
            fogEnabled
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {fogEnabled ? '迷雾: 开' : '迷雾: 关'}
        </button>
      </div>

      <div className="mb-4 text-lg font-semibold flex gap-8 text-gray-800 dark:text-gray-200">
        <span>步数: {steps}</span>
        <span>时间: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
      </div>

      <div className="relative border-4 border-gray-800 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden bg-gray-100">
         <canvas ref={canvasRef} className="block" />
         
         {gameStatus === 'won' && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
             <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform scale-110">
               <h2 className="text-3xl font-bold mb-4 text-green-600 dark:text-green-400">🎉 通关成功!</h2>
               <p className="mb-2 text-gray-700 dark:text-gray-300">耗时: {Math.floor(elapsedTime / 60)}分 {elapsedTime % 60}秒</p>
               <p className="mb-6 text-gray-700 dark:text-gray-300">步数: {steps}</p>
               <button 
                 onClick={initGame}
                 className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
               >
                 再玩一次
               </button>
             </div>
           </div>
         )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        电脑端：方向键或 WASD 移动 | 移动端：在迷宫上滑动
      </div>
    </div>
  );
}