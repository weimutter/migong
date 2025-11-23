export type Cell = {
  x: number;
  y: number;
  visited: boolean;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
};

export type Maze = Cell[][];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export const MAZE_SIZES: Record<Difficulty, { rows: number; cols: number }> = {
  easy: { rows: 10, cols: 10 },
  medium: { rows: 20, cols: 20 },
  hard: { rows: 30, cols: 30 },
  extreme: { rows: 40, cols: 40 },
};

// 初始化迷宫网格
const initializeGrid = (rows: number, cols: number): Maze => {
  const grid: Maze = [];
  for (let y = 0; y < rows; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < cols; x++) {
      row.push({
        x,
        y,
        visited: false,
        walls: { top: true, right: true, bottom: true, left: true },
      });
    }
    grid.push(row);
  }
  return grid;
};

// 获取未访问的邻居
const getUnvisitedNeighbors = (grid: Maze, cell: Cell): Cell[] => {
  const { x, y } = cell;
  const neighbors: Cell[] = [];
  const rows = grid.length;
  const cols = grid[0].length;

  // 上
  if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]);
  // 右
  if (x < cols - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]);
  // 下
  if (y < rows - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]);
  // 左
  if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]);

  return neighbors;
};

// 移除墙壁
const removeWalls = (current: Cell, next: Cell) => {
  const dx = current.x - next.x;
  const dy = current.y - next.y;

  if (dx === 1) {
    current.walls.left = false;
    next.walls.right = false;
  } else if (dx === -1) {
    current.walls.right = false;
    next.walls.left = false;
  }

  if (dy === 1) {
    current.walls.top = false;
    next.walls.bottom = false;
  } else if (dy === -1) {
    current.walls.bottom = false;
    next.walls.top = false;
  }
};

// 生成迷宫
export const generateMaze = (rows: number, cols: number): Maze => {
  const grid = initializeGrid(rows, cols);
  const stack: Cell[] = [];
  
  // 从左上角开始 (0,0)
  let current = grid[0][0];
  current.visited = true;

  // 确保有一个解：我们总是从 (0,0) 到 (cols-1, rows-1)
  // DFS 生成的是完美迷宫，任意两点间都有且仅有一条路径，所以天然保证有解。
  // 我们只需要生成完后，移除起点和终点的特定墙壁（如果做成开口式）
  // 或者就在 UI 上标记起点和终点即可。这里我们只负责生成结构。

  // 为了让迷宫更有趣，我们可以稍微随机化起点的选择，
  // 但对于标准游戏，通常固定起点左上，终点右下。

  do {
    const neighbors = getUnvisitedNeighbors(grid, current);

    if (neighbors.length > 0) {
      // 随机选择一个邻居
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      // 入栈
      stack.push(current);
      
      // 移除墙壁
      removeWalls(current, randomNeighbor);
      
      // 移动到下一个
      current = randomNeighbor;
      current.visited = true;
    } else if (stack.length > 0) {
      // 回溯
      current = stack.pop()!;
    }
  } while (stack.length > 0);

  return grid;
};

// 寻路算法 (用于提示或验证) - A* 或 BFS
// 这里实现一个简单的 BFS 来寻找最短路径
export const solveMaze = (maze: Maze, start: {x: number, y: number}, end: {x: number, y: number}): {x: number, y: number}[] => {
  const queue: { cell: Cell; path: {x: number, y: number}[] }[] = [];
  const visited = new Set<string>();
  
  const startCell = maze[start.y][start.x];
  queue.push({ cell: startCell, path: [{x: startCell.x, y: startCell.y}] });
  visited.add(`${startCell.x},${startCell.y}`);

  while (queue.length > 0) {
    const { cell, path } = queue.shift()!;
    
    if (cell.x === end.x && cell.y === end.y) {
      return path;
    }

    const { x, y } = cell;
    const neighbors: Cell[] = [];

    // 检查四个方向，注意要检查墙壁
    // 上
    if (!cell.walls.top && y > 0) neighbors.push(maze[y - 1][x]);
    // 右
    if (!cell.walls.right && x < maze[0].length - 1) neighbors.push(maze[y][x + 1]);
    // 下
    if (!cell.walls.bottom && y < maze.length - 1) neighbors.push(maze[y + 1][x]);
    // 左
    if (!cell.walls.left && x > 0) neighbors.push(maze[y][x - 1]);

    for (const neighbor of neighbors) {
      const key = `${neighbor.x},${neighbor.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ cell: neighbor, path: [...path, {x: neighbor.x, y: neighbor.y}] });
      }
    }
  }
  
  return [];
};