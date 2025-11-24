'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { generateMaze, solveMaze, Maze, MAZE_SIZES, Difficulty } from '@/lib/maze';

const CELL_SIZE = 20;
const WALL_THICKNESS = 2;
const PLAYER_COLOR = '#3b82f6'; // blue-500
const GOAL_COLOR = '#ef4444'; // red-500
const PATH_COLOR = 'rgba(234, 179, 8, 0.5)'; // yellow-500
const USER_PATH_COLOR = 'rgba(59, 130, 246, 0.6)'; // blue-500
const VISITED_COLOR = '#ffffff';
const UNVISITED_COLOR = '#000000'; // Dark mode background
const WALL_COLOR = '#374151'; // gray-700

export default function MazeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [maze, setMaze] = useState<Maze | null>(null);
  const [goalPos, setGoalPos] = useState({ x: 0, y: 0 });
  
  // 寻路提示路径
  const [hintPath, setHintPath] = useState<{ x: number; y: number }[]>([]);
  const [showHint, setShowHint] = useState(false);
  
  // 用户当前画出的路径
  const [userPath, setUserPath] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const [fogEnabled, setFogEnabled] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');

  // 使用 ref 来存储最新的状态，避免 useEffect 频繁重新绑定
  const mazeRef = useRef(maze);
  const gameStatusRef = useRef(gameStatus);
  const goalPosRef = useRef(goalPos);
  const userPathRef = useRef(userPath);
  const isDrawingRef = useRef(isDrawing);

  useEffect(() => { mazeRef.current = maze; }, [maze]);
  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);
  useEffect(() => { goalPosRef.current = goalPos; }, [goalPos]);
  useEffect(() => { userPathRef.current = userPath; }, [userPath]);
  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);

  const [steps, setSteps] = useState(0); // 这里的步数现在指路径长度
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 初始化游戏
  const initGame = useCallback(() => {
    const { rows, cols } = MAZE_SIZES[difficulty];
    const newMaze = generateMaze(rows, cols);
    setMaze(newMaze);
    setGoalPos({ x: cols - 1, y: rows - 1 });
    setHintPath([]);
    setShowHint(false);
    
    // 初始化用户路径，起点为 (0,0)
    const initialPath = [{ x: 0, y: 0 }];
    setUserPath(initialPath);
    
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

  // 尝试移动到新格子
  const tryMoveTo = useCallback((x: number, y: number) => {
    if (gameStatusRef.current !== 'playing' || !mazeRef.current) return;
    
    const currentPath = userPathRef.current;
    if (currentPath.length === 0) return;

    const lastPos = currentPath[currentPath.length - 1];
    
    // 如果已经在目标格子，不做任何事
    if (lastPos.x === x && lastPos.y === y) return;

    // 检查是否是回退（回到倒数第二个点）
    if (currentPath.length > 1) {
      const prevPos = currentPath[currentPath.length - 2];
      if (prevPos.x === x && prevPos.y === y) {
        // 回退，移除最后一个点
        const newPath = currentPath.slice(0, -1);
        setUserPath(newPath);
        setSteps(newPath.length - 1);
        return;
      }
    }

    // 检查是否相邻
    const dx = x - lastPos.x;
    const dy = y - lastPos.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return; // 必须是上下左右相邻

    // 检查是否有墙
    const currentCell = mazeRef.current[lastPos.y][lastPos.x];
    let blocked = false;
    if (dx === 1 && currentCell.walls.right) blocked = true;
    if (dx === -1 && currentCell.walls.left) blocked = true;
    if (dy === 1 && currentCell.walls.bottom) blocked = true;
    if (dy === -1 && currentCell.walls.top) blocked = true;

    if (!blocked) {
      // 检查该点是否已经在路径中（除了回退情况外，不允许自交）
      // 简单的处理是不允许重复访问，或者允许环路？通常迷宫不允许环路。
      // 这里我们简单检查是否已存在
      const exists = currentPath.some(p => p.x === x && p.y === y);
      if (!exists) {
        const newPath = [...currentPath, { x, y }];
        setUserPath(newPath);
        setSteps(newPath.length - 1);

        // 检查胜利
        if (x === goalPosRef.current.x && y === goalPosRef.current.y) {
          setGameStatus('won');
          setIsDrawing(false);
        }
      }
    }
  }, []);

  // 处理输入事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getGridPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor(((clientX - rect.left) * scaleX) / CELL_SIZE);
      const y = Math.floor(((clientY - rect.top) * scaleY) / CELL_SIZE);
      return { x, y };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (gameStatusRef.current !== 'playing') return;
      e.preventDefault(); // 防止滚动
      setIsDrawing(true);
      
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      
      const { x, y } = getGridPos(clientX, clientY);
      
      // 如果点击的是当前路径的末端，则开始继续画
      // 如果点击的是起跑线或者任意路径点，也可以支持（为了简单，目前假设总是接续末端）
      // 这里加一个逻辑：如果点击位置不在路径末端附近，可能想重置？或者暂时不处理
      // 实际上拖动式交互，通常只要按下去，就会尝试连接到最近的路径点，或者如果按在当前路径头，就开始延伸
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current || gameStatusRef.current !== 'playing') return;
      e.preventDefault();

      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const { x, y } = getGridPos(clientX, clientY);
      
      // 边界检查
      if (mazeRef.current && 
          x >= 0 && x < mazeRef.current[0].length && 
          y >= 0 && y < mazeRef.current.length) {
        tryMoveTo(x, y);
      }
    };

    const handleEnd = () => {
      setIsDrawing(false);
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [tryMoveTo]);

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

        // 绘制地板
        ctx.fillStyle = VISITED_COLOR;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        // 绘制墙壁
        ctx.fillStyle = WALL_COLOR;
        if (cell.walls.top) ctx.fillRect(x, y, CELL_SIZE, WALL_THICKNESS);
        if (cell.walls.right) ctx.fillRect(x + CELL_SIZE - WALL_THICKNESS, y, WALL_THICKNESS, CELL_SIZE);
        if (cell.walls.bottom) ctx.fillRect(x, y + CELL_SIZE - WALL_THICKNESS, CELL_SIZE, WALL_THICKNESS);
        if (cell.walls.left) ctx.fillRect(x, y, WALL_THICKNESS, CELL_SIZE);
      });
    });

    // 绘制提示路径 (黄色)
    if (showHint && hintPath.length > 0) {
      ctx.fillStyle = PATH_COLOR;
      hintPath.forEach(pos => {
        ctx.fillRect(
          pos.x * CELL_SIZE + WALL_THICKNESS, 
          pos.y * CELL_SIZE + WALL_THICKNESS, 
          CELL_SIZE - 2 * WALL_THICKNESS, 
          CELL_SIZE - 2 * WALL_THICKNESS
        );
      });
    }

    // 绘制用户路径 (蓝色线条)
    if (userPath.length > 0) {
      ctx.strokeStyle = USER_PATH_COLOR;
      ctx.lineWidth = CELL_SIZE / 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      const startX = userPath[0].x * CELL_SIZE + CELL_SIZE / 2;
      const startY = userPath[0].y * CELL_SIZE + CELL_SIZE / 2;
      ctx.moveTo(startX, startY);
      
      for (let i = 1; i < userPath.length; i++) {
        const px = userPath[i].x * CELL_SIZE + CELL_SIZE / 2;
        const py = userPath[i].y * CELL_SIZE + CELL_SIZE / 2;
        ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 绘制当前头部
      const head = userPath[userPath.length - 1];
      ctx.fillStyle = PLAYER_COLOR;
      ctx.beginPath();
      ctx.arc(
        head.x * CELL_SIZE + CELL_SIZE / 2,
        head.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // 绘制终点
    ctx.fillStyle = GOAL_COLOR;
    ctx.fillRect(
      goalPos.x * CELL_SIZE + 4,
      goalPos.y * CELL_SIZE + 4,
      CELL_SIZE - 8,
      CELL_SIZE - 8
    );

    // 绘制战争迷雾
    if (fogEnabled && gameStatus === 'playing' && userPath.length > 0) {
      const head = userPath[userPath.length - 1];
      const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
      const headY = head.y * CELL_SIZE + CELL_SIZE / 2;

      const gradient = ctx.createRadialGradient(
        headX, headY, CELL_SIZE * 2,
        headX, headY, CELL_SIZE * 5
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 完全遮挡远处
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.arc(headX, headY, CELL_SIZE * 5, 0, Math.PI * 2, true);
      ctx.fillStyle = 'black';
      ctx.fill();
    }

  }, [maze, userPath, goalPos, difficulty, showHint, hintPath, fogEnabled, gameStatus]);

  // 处理提示
  const handleHint = () => {
    if (!maze || userPath.length === 0) return;
    const currentPos = userPath[userPath.length - 1];
    const solution = solveMaze(maze, currentPos, goalPos);
    setHintPath(solution);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 2000);
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

      <div className="relative border-4 border-gray-800 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden bg-gray-100 touch-none">
         <canvas ref={canvasRef} className="block cursor-crosshair" />
         
         {gameStatus === 'won' && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
             <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform scale-110">
               <h2 className="text-3xl font-bold mb-4 text-green-600 dark:text-green-400">🎉 通关成功!</h2>
               <p className="mb-2 text-gray-700 dark:text-gray-300">耗时: {Math.floor(elapsedTime / 60)}分 {elapsedTime % 60}秒</p>
               <p className="mb-6 text-gray-700 dark:text-gray-300">路径长度: {steps}</p>
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
        按住鼠标或手指拖动来绘制路线
      </div>
    </div>
  );
}