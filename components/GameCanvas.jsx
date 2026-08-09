"use client";

import { useEffect, useRef } from "react";

const MAZE_CONFIG = {
  loopRate: 0.12,
  maxGenerationAttempts: 20,
  minEscapeDistanceRatio: 0.45,
  maxEscapeDistanceRatio: 0.85,
  minBranchingRatio: 0.12,
  maxDeadEndRatio: 0.28,
  minGuardPlayerPathDist: 12,
  minGuardExitPathDist: 5,
  minCoinSeparationPathDist: 8,
  minCoinPlayerPathDist: 5,
  guardCount: 3,
  coinCount: 3,
};

const GUARD_CONFIG = {
  speed: 1.8,
  pathRecalcInterval: 250,
  waypointThreshold: 3,
  detectionRadius: 10,
  searchDuration: 3000,
  debugPaths: false,
};

function createPRNG(seed = Date.now()) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class PriorityQueue {
  constructor() {
    this.nodes = [];
  }
  push(node) {
    this.nodes.push(node);
    this._bubbleUp(this.nodes.length - 1);
  }
  pop() {
    if (this.nodes.length === 0) return null;
    const top = this.nodes[0];
    const bottom = this.nodes.pop();
    if (this.nodes.length > 0) {
      this.nodes[0] = bottom;
      this._sinkDown(0);
    }
    return top;
  }
  size() {
    return this.nodes.length;
  }
  _bubbleUp(n) {
    const element = this.nodes[n];
    while (n > 0) {
      const parentN = Math.floor((n - 1) / 2);
      const parent = this.nodes[parentN];
      if (element.f >= parent.f) break;
      this.nodes[parentN] = element;
      this.nodes[n] = parent;
      n = parentN;
    }
  }
  _sinkDown(n) {
    const length = this.nodes.length;
    const element = this.nodes[n];
    while (true) {
      let child2N = (n + 1) * 2;
      let child1N = child2N - 1;
      let swap = null;
      if (child1N < length) {
        if (this.nodes[child1N].f < element.f) swap = child1N;
      }
      if (child2N < length) {
        if (
          (swap === null && this.nodes[child2N].f < element.f) ||
          (swap !== null && this.nodes[child2N].f < this.nodes[child1N].f)
        ) {
          swap = child2N;
        }
      }
      if (swap === null) break;
      this.nodes[n] = this.nodes[swap];
      this.nodes[swap] = element;
      n = swap;
    }
  }
}

function buildNavGraph(grid, rows, cols) {
  const graph = {};
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 0) {
        const key = `${r},${c}`;
        graph[key] = [];
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            grid[nr][nc] === 0
          ) {
            graph[key].push({ r: nr, c: nc });
          }
        }
      }
    }
  }
  return graph;
}

function findPathAStar(navGraph, startNode, goalNode) {
  if (!startNode || !goalNode) return [];
  if (startNode.r === goalNode.r && startNode.c === goalNode.c) {
    return [{ r: goalNode.r, c: goalNode.c }];
  }

  const openSet = new PriorityQueue();
  const cameFrom = new Map();
  const gScore = new Map();

  const startKey = `${startNode.r},${startNode.c}`;
  const goalKey = `${goalNode.r},${goalNode.c}`;

  const heuristic = (r1, c1, r2, c2) => Math.abs(r1 - r2) + Math.abs(c1 - c2);

  gScore.set(startKey, 0);
  openSet.push({
    r: startNode.r,
    c: startNode.c,
    f: heuristic(startNode.r, startNode.c, goalNode.r, goalNode.c),
  });

  while (openSet.size() > 0) {
    const current = openSet.pop();
    const currentKey = `${current.r},${current.c}`;

    if (currentKey === goalKey) {
      const path = [];
      let temp = currentKey;
      while (temp) {
        const [r, c] = temp.split(",").map(Number);
        path.push({ r, c });
        temp = cameFrom.get(temp);
      }
      path.reverse();
      return path;
    }

    const neighbors = navGraph[currentKey] || [];
    const currentG = gScore.get(currentKey) ?? Infinity;

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.r},${neighbor.c}`;
      const tentativeG = currentG + 1;

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeG);
        openSet.push({
          r: neighbor.r,
          c: neighbor.c,
          f:
            tentativeG +
            heuristic(neighbor.r, neighbor.c, goalNode.r, goalNode.c),
        });
      }
    }
  }

  return [];
}

function hasLineOfSight(grid, startCell, endCell) {
  let x0 = startCell.c;
  let y0 = startCell.r;
  let x1 = endCell.c;
  let y1 = endCell.r;

  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (
      y0 < 0 ||
      y0 >= grid.length ||
      x0 < 0 ||
      x0 >= grid[0].length ||
      grid[y0][x0] === 1
    ) {
      return false;
    }
    if (x0 === x1 && y0 === y1) break;
    let e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return true;
}

function canGuardTravelDirectly(
  startX,
  startY,
  endX,
  endY,
  width,
  height,
  hitsWall,
) {
  const dist = Math.hypot(endX - startX, endY - startY);
  if (dist === 0) return true;

  const stepSize = 8;
  const steps = Math.ceil(dist / stepSize);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const currX = startX + (endX - startX) * t;
    const currY = startY + (endY - startY) * t;

    if (hitsWall(currX, currY, width, height)) {
      return false;
    }
  }
  return true;
}

function simplifyPath(path, tileSize, hitsWall) {
  if (path.length <= 2) return path;

  const simplified = [path[0]];
  let currIdx = 0;

  while (currIdx < path.length - 1) {
    let furthestVisible = currIdx + 1;
    const startX = path[currIdx].c * tileSize + 4;
    const startY = path[currIdx].r * tileSize + 4;

    for (let i = currIdx + 2; i < path.length; i++) {
      const candX = path[i].c * tileSize + 4;
      const candY = path[i].r * tileSize + 4;

      if (
        canGuardTravelDirectly(startX, startY, candX, candY, 32, 32, hitsWall)
      ) {
        furthestVisible = i;
      } else {
        break;
      }
    }
    simplified.push(path[furthestVisible]);
    currIdx = furthestVisible;
  }
  return simplified;
}

function generateBaseMazePrims(rows, cols, rng) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1));
  const frontiers = [];

  const addFrontiers = (r, c) => {
    const dirs = [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1) {
        if (grid[nr][nc] === 1) {
          frontiers.push({ r: nr, c: nc, pr: r, pc: c });
        }
      }
    }
  };

  grid[1][1] = 0;
  addFrontiers(1, 1);

  while (frontiers.length > 0) {
    const randIdx = Math.floor(rng() * frontiers.length);
    const { r, c, pr, pc } = frontiers[randIdx];

    frontiers[randIdx] = frontiers[frontiers.length - 1];
    frontiers.pop();

    if (grid[r][c] === 1) {
      grid[r][c] = 0;
      grid[(r + pr) / 2][(c + pc) / 2] = 0;
      addFrontiers(r, c);
    }
  }
  return grid;
}

function addControlledLoops(grid, rows, cols, loopRate, rng) {
  const candidates = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c] === 1) {
        const top = grid[r - 1][c] === 0;
        const bottom = grid[r + 1][c] === 0;
        const left = grid[r][c - 1] === 0;
        const right = grid[r][c + 1] === 0;

        if (
          (top && bottom && !left && !right) ||
          (left && right && !top && !bottom)
        ) {
          candidates.push({ r, c });
        }
      }
    }
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const countToOpen = Math.floor(candidates.length * loopRate);
  for (let i = 0; i < countToOpen; i++) {
    const { r, c } = candidates[i];
    grid[r][c] = 0;
  }
}

function analyzeMazeBFS(grid, rows, cols, startTile) {
  const distanceMap = Array.from({ length: rows }, () =>
    Array(cols).fill(Infinity),
  );
  const queue = [];
  const openTiles = [];

  distanceMap[startTile.r][startTile.c] = 0;
  queue.push(startTile);

  let head = 0;
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (head < queue.length) {
    const { r, c } = queue[head++];
    const dist = distanceMap[r][c];
    let neighborCount = 0;

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0) {
        neighborCount++;
        if (distanceMap[nr][nc] === Infinity) {
          distanceMap[nr][nc] = dist + 1;
          queue.push({ r: nr, c: nc });
        }
      }
    }
    openTiles.push({ r, c, dist, neighborCount });
  }

  let totalWalkable = 0;
  let deadEnds = 0;
  let junctions = 0;

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c] === 0) {
        totalWalkable++;
        let neighbors = 0;
        for (const [dr, dc] of dirs) {
          if (grid[r + dr][c + dc] === 0) neighbors++;
        }
        if (neighbors === 1) deadEnds++;
        if (neighbors >= 3) junctions++;
      }
    }
  }

  return {
    distanceMap,
    openTiles,
    totalWalkable,
    deadEndRatio: deadEnds / (totalWalkable || 1),
    branchingRatio: junctions / (totalWalkable || 1),
    allConnected: totalWalkable === openTiles.length,
  };
}

function evaluateQuality(
  playerAnalysis,
  exitAnalysis,
  rows,
  cols,
  startTile,
  exitTile,
) {
  if (!playerAnalysis.allConnected) return { valid: false, score: -Infinity };
  const exitDist = playerAnalysis.distanceMap[exitTile.r][exitTile.c];
  if (exitDist === Infinity) return { valid: false, score: -Infinity };

  const maxPossibleDist = rows * cols;
  const minExitDist = maxPossibleDist * MAZE_CONFIG.minEscapeDistanceRatio;
  const maxExitDist = maxPossibleDist * MAZE_CONFIG.maxEscapeDistanceRatio;

  let valid = true;
  if (exitDist < minExitDist || exitDist > maxExitDist) valid = false;
  if (playerAnalysis.deadEndRatio > MAZE_CONFIG.maxDeadEndRatio) valid = false;
  if (playerAnalysis.branchingRatio < MAZE_CONFIG.minBranchingRatio)
    valid = false;

  let score =
    exitDist * 2 +
    playerAnalysis.branchingRatio * 500 -
    playerAnalysis.deadEndRatio * 300;
  return { valid, score };
}

function placeEntitiesSmart(
  playerAnalysis,
  exitAnalysis,
  startTile,
  exitTile,
  rng,
) {
  const playerDistanceMap = playerAnalysis.distanceMap;
  const exitDistanceMap = exitAnalysis.distanceMap;

  const pool = playerAnalysis.openTiles.filter((t) => {
    if (t.r === startTile.r && t.c === startTile.c) return false;
    if (t.r === exitTile.r && t.c === exitTile.c) return false;
    return t.dist >= MAZE_CONFIG.minCoinPlayerPathDist;
  });

  const exitDist = playerDistanceMap[exitTile.r][exitTile.c];
  const bandSize = exitDist / 3;
  const band1 = pool.filter((t) => t.dist < bandSize);
  const band2 = pool.filter((t) => t.dist >= bandSize && t.dist < bandSize * 2);
  const band3 = pool.filter((t) => t.dist >= bandSize * 2);

  const selectedCoins = [];
  const pickFromBand = (band) => {
    const candidates = band.filter((candidate) =>
      selectedCoins.every(
        (coin) =>
          Math.abs(
            playerDistanceMap[candidate.r][candidate.c] -
              playerDistanceMap[coin.r][coin.c],
          ) >= MAZE_CONFIG.minCoinSeparationPathDist,
      ),
    );
    if (candidates.length > 0)
      return candidates[Math.floor(rng() * candidates.length)];
    return pool[Math.floor(rng() * pool.length)];
  };

  selectedCoins.push(pickFromBand(band1.length ? band1 : pool));
  selectedCoins.push(pickFromBand(band2.length ? band2 : pool));
  selectedCoins.push(pickFromBand(band3.length ? band3 : pool));

  const validGuardTiles = pool.filter((t) => {
    const shortestPathToPlayer = playerDistanceMap[t.r][t.c];
    const shortestPathToExit = exitDistanceMap[t.r][t.c];
    const isOnCoin = selectedCoins.some((c) => c.r === t.r && c.c === t.c);

    return (
      shortestPathToPlayer >= MAZE_CONFIG.minGuardPlayerPathDist &&
      shortestPathToExit >= MAZE_CONFIG.minGuardExitPathDist &&
      !isOnCoin
    );
  });

  const selectedGuards = [];
  const candidates = [...validGuardTiles];

  while (
    selectedGuards.length < MAZE_CONFIG.guardCount &&
    candidates.length > 0
  ) {
    if (selectedGuards.length === 0) {
      const idx = Math.floor(rng() * candidates.length);
      selectedGuards.push(candidates[idx]);
      candidates.splice(idx, 1);
    } else {
      let bestCandidateIdx = -1;
      let maxScore = -Infinity;

      for (let i = 0; i < candidates.length; i++) {
        const cand = candidates[i];
        let minGuardDist = Infinity;

        for (const g of selectedGuards) {
          const pathDist = Math.abs(
            playerDistanceMap[cand.r][cand.c] - playerDistanceMap[g.r][g.c],
          );
          const geoDist = Math.hypot(cand.r - g.r, cand.c - g.c);
          const combinedDist = pathDist + geoDist;
          if (combinedDist < minGuardDist) {
            minGuardDist = combinedDist;
          }
        }

        if (minGuardDist > maxScore) {
          maxScore = minGuardDist;
          bestCandidateIdx = i;
        }
      }

      if (bestCandidateIdx !== -1) {
        selectedGuards.push(candidates[bestCandidateIdx]);
        candidates.splice(bestCandidateIdx, 1);
      } else {
        break;
      }
    }
  }

  return { coins: selectedCoins, guards: selectedGuards };
}

function generatePlayableLevel(rows, cols, customSeed = null) {
  const rng = createPRNG(customSeed ?? Date.now());
  const startTile = { r: 1, c: 1 };
  const exitTile = { r: rows - 2, c: cols - 2 };

  let bestCandidate = null;
  let bestScore = -Infinity;

  for (
    let attempt = 0;
    attempt < MAZE_CONFIG.maxGenerationAttempts;
    attempt++
  ) {
    const grid = generateBaseMazePrims(rows, cols, rng);
    addControlledLoops(grid, rows, cols, MAZE_CONFIG.loopRate, rng);
    grid[exitTile.r][exitTile.c] = 0;

    const playerAnalysis = analyzeMazeBFS(grid, rows, cols, startTile);
    const exitAnalysis = analyzeMazeBFS(grid, rows, cols, exitTile);
    const evaluation = evaluateQuality(
      playerAnalysis,
      exitAnalysis,
      rows,
      cols,
      startTile,
      exitTile,
    );

    if (evaluation.score > bestScore) {
      const entities = placeEntitiesSmart(
        playerAnalysis,
        exitAnalysis,
        startTile,
        exitTile,
        rng,
      );
      if (entities.guards.length === MAZE_CONFIG.guardCount) {
        bestScore = evaluation.score;
        bestCandidate = {
          grid,
          startTile,
          exitTile,
          coins: entities.coins,
          guards: entities.guards,
          valid: evaluation.valid,
          openTiles: playerAnalysis.openTiles,
        };
      }
    }
    if (bestCandidate && bestCandidate.valid) return bestCandidate;
  }

  if (bestCandidate) return bestCandidate;

  const fallbackGrid = generateBaseMazePrims(rows, cols, rng);
  fallbackGrid[exitTile.r][exitTile.c] = 0;
  const fallbackPlayerAnalysis = analyzeMazeBFS(
    fallbackGrid,
    rows,
    cols,
    startTile,
  );
  const fallbackExitAnalysis = analyzeMazeBFS(
    fallbackGrid,
    rows,
    cols,
    exitTile,
  );
  const fallbackEntities = placeEntitiesSmart(
    fallbackPlayerAnalysis,
    fallbackExitAnalysis,
    startTile,
    exitTile,
    rng,
  );

  return {
    grid: fallbackGrid,
    startTile,
    exitTile,
    coins: fallbackEntities.coins,
    guards: fallbackEntities.guards,
    valid: true,
    openTiles: fallbackPlayerAnalysis.openTiles,
  };
}

export default function GameCanvas({ onWin, onLose, onCollectCoin }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const TILE_SIZE = 40;
    let cols = Math.floor(canvas.width / TILE_SIZE);
    let rows = Math.floor(canvas.height / TILE_SIZE);
    if (cols % 2 === 0) cols -= 1;
    if (rows % 2 === 0) rows -= 1;

    const totalKeysRequired = MAZE_CONFIG.coinCount;

    const playerImg = new Image();
    playerImg.src = "/player.svg";

    const guardImg = new Image();
    guardImg.src = "/Pixel-Guards.svg";

    const coinImg = new Image();
    coinImg.src = "/coins.svg";

    const level = generatePlayableLevel(rows, cols);
    const grid = level.grid;
    const navGraph = buildNavGraph(grid, rows, cols);

    const player = {
      x: level.startTile.c * TILE_SIZE + 4,
      y: level.startTile.r * TILE_SIZE + 4,
      width: 32,
      height: 32,
      speed: 4.0,
      keysCollected: 0,
      direction: "right",
      isMoving: false,
    };

    const keysItems = level.coins.map((kt) => ({
      x: kt.c * TILE_SIZE + 8,
      y: kt.r * TILE_SIZE + 8,
      width: 24,
      height: 24,
      collected: false,
    }));

    const exit = {
      x: level.exitTile.c * TILE_SIZE + 4,
      y: level.exitTile.r * TILE_SIZE + 4,
      width: 32,
      height: 32,
    };

    const hitsWall = (x, y, w, h) => {
      const left = Math.floor(x / TILE_SIZE);
      const right = Math.floor((x + w) / TILE_SIZE);
      const top = Math.floor(y / TILE_SIZE);
      const bottom = Math.floor((y + h) / TILE_SIZE);

      for (let r = top; r <= bottom; r++) {
        for (let c = left; c <= right; c++) {
          if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === 1) {
            return true;
          }
        }
      }
      return false;
    };

    const getGridCell = (entity) => ({
      r: Math.floor((entity.y + entity.height / 2) / TILE_SIZE),
      c: Math.floor((entity.x + entity.width / 2) / TILE_SIZE),
    });

    const isTileOnCoin = (tile) =>
      keysItems.some(
        (k) =>
          !k.collected &&
          Math.floor((k.y + 12) / TILE_SIZE) === tile.r &&
          Math.floor((k.x + 12) / TILE_SIZE) === tile.c,
      );

    const generateGuardPatrolRoute = (guardSpawnTile) => {
      const preferred = level.openTiles.filter((t) => {
        if (t.r === level.startTile.r && t.c === level.startTile.c)
          return false;
        if (t.r === level.exitTile.r && t.c === level.exitTile.c) return false;
        if (isTileOnCoin(t)) return false;
        return t.neighborCount >= 2;
      });

      const pool = preferred.length >= 6 ? preferred : level.openTiles;
      const route = [{ r: guardSpawnTile.r, c: guardSpawnTile.c }];

      while (route.length < 3 && pool.length > 0) {
        let bestTile = null;
        let maxDist = -1;

        for (let i = 0; i < 15; i++) {
          const cand = pool[Math.floor(Math.random() * pool.length)];
          const minDistToRoute = Math.min(
            ...route.map((p) => Math.hypot(p.r - cand.r, p.c - cand.c)),
          );

          if (minDistToRoute > maxDist && minDistToRoute >= 4) {
            maxDist = minDistToRoute;
            bestTile = cand;
          }
        }

        if (bestTile) {
          route.push({ r: bestTile.r, c: bestTile.c });
        } else {
          const fallback = pool[Math.floor(Math.random() * pool.length)];
          route.push({ r: fallback.r, c: fallback.c });
        }
      }
      return route;
    };

    const guards = level.guards.map((gt) => {
      const patrolPoints = generateGuardPatrolRoute(gt);

      return {
        x: gt.c * TILE_SIZE + 4,
        y: gt.r * TILE_SIZE + 4,
        width: 32,
        height: 32,
        speed: GUARD_CONFIG.speed,
        direction: "down",
        state: "PATROL",
        path: [],
        pathIndex: 0,
        lastPathTime: 0,
        lastTargetCell: null,
        patrolPoints,
        patrolIndex: 0,
        lastKnownPlayerCell: null,
        searchTimer: 0,
        searchPhase: 0,
      };
    });

    const keys = {};
    const handleKeyDown = (e) => (keys[e.key.toLowerCase()] = true);
    const handleKeyUp = (e) => (keys[e.key.toLowerCase()] = false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const checkCollision = (a, b) =>
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;

    let animationFrameId;

    const gameLoop = (time) => {
      let dx = 0;
      let dy = 0;

      if (keys["w"] || keys["arrowup"]) {
        dy -= player.speed;
        player.direction = "up";
      } else if (keys["s"] || keys["arrowdown"]) {
        dy += player.speed;
        player.direction = "down";
      }

      if (keys["a"] || keys["arrowleft"]) {
        dx -= player.speed;
        player.direction = "left";
      } else if (keys["d"] || keys["arrowright"]) {
        dx += player.speed;
        player.direction = "right";
      }

      player.isMoving = dx !== 0 || dy !== 0;

      if (
        dx !== 0 &&
        !hitsWall(player.x + dx, player.y, player.width, player.height)
      ) {
        player.x += dx;
      }
      if (
        dy !== 0 &&
        !hitsWall(player.x, player.y + dy, player.width, player.height)
      ) {
        player.y += dy;
      }

      for (const k of keysItems) {
        if (!k.collected && checkCollision(player, k)) {
          k.collected = true;
          player.keysCollected += 1;
          onCollectCoin();
        }
      }

      const playerCell = getGridCell(player);

      for (const guard of guards) {
        const guardCell = getGridCell(guard);
        const guardCenterX = guard.x + guard.width / 2;
        const guardCenterY = guard.y + guard.height / 2;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        const physicalDistance = Math.hypot(
          playerCenterX - guardCenterX,
          playerCenterY - guardCenterY,
        );
        const detectionRadiusPixels = GUARD_CONFIG.detectionRadius * TILE_SIZE;

        const canSeePlayer =
          physicalDistance <= detectionRadiusPixels &&
          hasLineOfSight(grid, guardCell, playerCell);

        if (canSeePlayer) {
          if (guard.state !== "CHASE") {
            guard.state = "CHASE";
            guard.path = [];
            guard.pathIndex = 0;
            guard.lastTargetCell = null;
          }
          guard.lastKnownPlayerCell = playerCell;
        } else if (guard.state === "CHASE") {
          guard.state = "SEARCH";
          guard.searchTimer = time;
          guard.searchPhase = 0;
          guard.path = [];
          guard.pathIndex = 0;
          guard.lastTargetCell = null;
        } else if (guard.state === "SEARCH") {
          if (time - guard.searchTimer > GUARD_CONFIG.searchDuration) {
            guard.state = "PATROL";
            guard.path = [];
            guard.pathIndex = 0;
            guard.lastTargetCell = null;
          }
        }

        let targetGoal = null;
        if (guard.state === "CHASE") {
          targetGoal = playerCell;
        } else if (guard.state === "SEARCH") {
          if (guard.searchPhase === 0) {
            targetGoal = guard.lastKnownPlayerCell;
            if (guardCell.r === targetGoal.r && guardCell.c === targetGoal.c) {
              guard.searchPhase = 1;
              const neighbors = navGraph[`${guardCell.r},${guardCell.c}`] || [];
              if (neighbors.length > 0) {
                targetGoal =
                  neighbors[Math.floor(Math.random() * neighbors.length)];
                guard.lastKnownPlayerCell = targetGoal;
                guard.path = [];
              }
            }
          } else {
            targetGoal = guard.lastKnownPlayerCell;
          }
        } else if (guard.state === "PATROL") {
          targetGoal = guard.patrolPoints[guard.patrolIndex];
          if (guardCell.r === targetGoal.r && guardCell.c === targetGoal.c) {
            guard.patrolIndex =
              (guard.patrolIndex + 1) % guard.patrolPoints.length;
            targetGoal = guard.patrolPoints[guard.patrolIndex];
            guard.path = [];
            guard.pathIndex = 0;
            guard.lastTargetCell = null;
          }
        }

        const needsReplan =
          !targetGoal ||
          guard.path.length === 0 ||
          guard.pathIndex >= guard.path.length ||
          !guard.lastTargetCell ||
          targetGoal.r !== guard.lastTargetCell.r ||
          targetGoal.c !== guard.lastTargetCell.c ||
          time - guard.lastPathTime > GUARD_CONFIG.pathRecalcInterval;

        if (needsReplan && targetGoal) {
          const rawPath = findPathAStar(navGraph, guardCell, targetGoal);
          guard.path = simplifyPath(rawPath, TILE_SIZE, hitsWall);
          guard.pathIndex = 0;
          guard.lastPathTime = time;
          guard.lastTargetCell = { r: targetGoal.r, c: targetGoal.c };
        }

        if (guard.path && guard.pathIndex < guard.path.length) {
          let nextCell = guard.path[guard.pathIndex];

          if (
            nextCell.r === guardCell.r &&
            nextCell.c === guardCell.c &&
            guard.pathIndex < guard.path.length - 1
          ) {
            guard.pathIndex++;
            nextCell = guard.path[guard.pathIndex];
          }

          const targetX = nextCell.c * TILE_SIZE + 4;
          const targetY = nextCell.r * TILE_SIZE + 4;

          const gdx = targetX - guard.x;
          const gdy = targetY - guard.y;
          const distToWaypoint = Math.hypot(gdx, gdy);

          if (distToWaypoint <= GUARD_CONFIG.waypointThreshold) {
            guard.x = targetX;
            guard.y = targetY;
            guard.pathIndex++;
          } else {
            const step = Math.min(guard.speed, distToWaypoint);
            const moveX = (gdx / distToWaypoint) * step;
            const moveY = (gdy / distToWaypoint) * step;

            if (Math.abs(moveX) > Math.abs(moveY)) {
              guard.direction = moveX > 0 ? "right" : "left";
            } else {
              guard.direction = moveY > 0 ? "down" : "up";
            }

            let movedX = false;
            let movedY = false;

            if (
              !hitsWall(guard.x + moveX, guard.y, guard.width, guard.height)
            ) {
              guard.x += moveX;
              movedX = true;
            }
            if (
              !hitsWall(guard.x, guard.y + moveY, guard.width, guard.height)
            ) {
              guard.y += moveY;
              movedY = true;
            }

            if (!movedX && !movedY) {
              guard.path = [];
              guard.pathIndex = 0;
            }
          }
        }

        if (checkCollision(player, guard)) {
          onLose();
          return;
        }
      }

      if (checkCollision(player, exit)) {
        if (player.keysCollected >= totalKeysRequired) {
          onWin();
          return;
        }
      }

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#334155";
      ctx.strokeStyle = "#1e293b";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === 1) {
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      for (const k of keysItems) {
        if (!k.collected) {
          if (coinImg.complete && coinImg.naturalWidth !== 0) {
            ctx.drawImage(coinImg, k.x, k.y, k.width, k.height);
          } else {
            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc(k.x + 12, k.y + 12, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.fillStyle =
        player.keysCollected >= totalKeysRequired ? "#10b981" : "#64748b";
      ctx.fillRect(exit.x, exit.y, exit.width, exit.height);

      if (playerImg.complete && playerImg.naturalWidth !== 0) {
        ctx.drawImage(
          playerImg,
          player.x,
          player.y,
          player.width,
          player.height,
        );
      } else {
        ctx.fillStyle = "#eab308";
        ctx.fillRect(player.x, player.y, player.width, player.height);
      }

      for (const guard of guards) {
        if (guardImg.complete && guardImg.naturalWidth !== 0) {
          ctx.drawImage(guardImg, guard.x, guard.y, guard.width, guard.height);
        } else {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(guard.x, guard.y, guard.width, guard.height);
        }
      }

      if (GUARD_CONFIG.debugPaths) {
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          playerCell.c * TILE_SIZE,
          playerCell.r * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        );

        for (const guard of guards) {
          ctx.fillStyle =
            guard.state === "CHASE"
              ? "#ff0000"
              : guard.state === "SEARCH"
                ? "#ffff00"
                : "#00ffff";
          ctx.font = "10px monospace";
          ctx.fillText(guard.state, guard.x, guard.y - 6);

          if (guard.path && guard.path.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = guard.state === "CHASE" ? "#ff4444" : "#44ffff";
            ctx.lineWidth = 3;
            ctx.moveTo(guard.x + guard.width / 2, guard.y + guard.height / 2);

            for (let i = guard.pathIndex; i < guard.path.length; i++) {
              const node = guard.path[i];
              ctx.lineTo(
                node.c * TILE_SIZE + TILE_SIZE / 2,
                node.r * TILE_SIZE + TILE_SIZE / 2,
              );
            }
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px 'Press Start 2P', monospace";
      ctx.fillText(
        `Coins: ${player.keysCollected} / ${totalKeysRequired}`,
        20,
        35,
      );

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onWin, onLose, onCollectCoin]);

  return (
    <canvas ref={canvasRef} className="block w-full h-full pixel-rendering" />
  );
}
