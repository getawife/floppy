import { PLATFORM_WIDTH, PLATFORM_HEIGHT, getBiome } from "./constants";
import { BIOME_DECORATIONS } from "./biomeDecorations";

export class LevelGenerator {
  static MIN_HORIZ_GAP = 90;
  static MAX_HORIZ_GAP = 160;
  static MAX_VERT_DISPLACEMENT = 60;

  static generateChunk(engine, canvasHeight) {
    const lastPlat = engine.platforms[engine.platforms.length - 1] || {
      x: 0,
      y: canvasHeight - 180,
      width: PLATFORM_WIDTH,
      isMoving: false,
    };

    let prevX = lastPlat.x;
    let prevY = lastPlat.y;
    let prevWidth = lastPlat.width;
    let prevWasMoving = lastPlat.isMoving || false;

    const minY = 180;
    const maxY = canvasHeight - 160;

    const numPlatforms = 5;

    for (let i = 0; i < numPlatforms; i++) {
      const dx = Math.floor(
        Math.random() * (this.MAX_HORIZ_GAP - this.MIN_HORIZ_GAP) +
          this.MIN_HORIZ_GAP,
      );

      let dy =
        Math.floor(Math.random() * (this.MAX_VERT_DISPLACEMENT * 2)) -
        this.MAX_VERT_DISPLACEMENT;

      let nextX = prevX + prevWidth + dx;
      let nextY = prevY + dy;

      if (nextY < minY) nextY = minY + Math.floor(Math.random() * 20);
      if (nextY > maxY) nextY = maxY - Math.floor(Math.random() * 20);

      const pWidth = Math.random() < 0.2 ? PLATFORM_WIDTH + 40 : PLATFORM_WIDTH;

      const isMoving = !prevWasMoving && Math.random() < 0.15;

      const biome = getBiome(nextX);

      const newPlat = {
        id: engine.nextPlatformId++,
        x: nextX,
        y: nextY,
        startX: nextX,
        width: pWidth,
        height: PLATFORM_HEIGHT,
        isMoving,
        moveRange: 70,
        moveSpeed: 1.0,
        moveDir: 1,
        hasEnemy: false,
        biome: biome.name,
        theme: biome.platformTheme,
      };

      engine.platforms.push(newPlat);

      if (!isMoving) {
        this.populatePlatformDecorations(engine, newPlat, biome);
      }

      if (!isMoving && Math.random() < 0.2) {
        if (!engine.mushrooms) engine.mushrooms = [];
        engine.mushrooms.push({
          id: Math.random(),
          x: nextX + pWidth / 2 - 8,
          y: nextY - 16,
          width: 16,
          height: 16,
        });
      }

      if (Math.random() < 0.25) {
        if (!engine.fruits) engine.fruits = [];
        engine.fruits.push({
          id: Math.random(),
          x: nextX + pWidth / 2 - 8,
          y: nextY - 36,
          type: Math.floor(Math.random() * 4),
          collected: false,
        });
      }

      if (Math.random() < 0.5) {
        const coinCount = 3;
        for (let j = 1; j <= coinCount; j++) {
          const t = j / (coinCount + 1);
          const arcX = prevX + prevWidth + (nextX - (prevX + prevWidth)) * t;
          const arcY = prevY + (nextY - prevY) * t - Math.sin(t * Math.PI) * 40;

          engine.coins.push({
            id: Math.random(),
            x: arcX,
            y: arcY,
            collected: false,
          });
        }
      } else {
        for (let j = 0; j < 3; j++) {
          engine.coins.push({
            id: Math.random(),
            x: nextX + 15 + j * 20,
            y: nextY - 24,
            collected: false,
          });
        }
      }

      if (!isMoving && pWidth >= PLATFORM_WIDTH && Math.random() < 0.25) {
        newPlat.hasEnemy = true;
        engine.enemies.push({
          id: Math.random(),
          x: nextX + pWidth / 2 - 12,
          y: nextY - 24,
          width: 24,
          height: 24,
          vx: 1.0,
          vy: 0,
          speed: 1.0,
          grounded: true,
          facingLeft: false,
          patrolMinX: nextX,
          patrolMaxX: nextX + pWidth - 24,
          platformId: newPlat.id,
        });
      }

      prevX = nextX;
      prevY = nextY;
      prevWidth = pWidth;
      prevWasMoving = isMoving;
    }
  }

  static populatePlatformDecorations(engine, platform, biome) {
    if (!engine.decorations) engine.decorations = [];

    const biomeKey = biome?.key || biome?.name?.toLowerCase() || "grassland";
    const availableDecos =
      BIOME_DECORATIONS[biomeKey] || BIOME_DECORATIONS.grassland;

    const margin = 16;
    const step = 24;

    for (
      let xOffset = margin;
      xOffset < platform.width - margin;
      xOffset += step
    ) {
      if (Math.random() < 0.35) {
        const decoType =
          availableDecos[Math.floor(Math.random() * availableDecos.length)];

        if (Math.random() <= decoType.frequency) {
          engine.decorations.push({
            id: Math.random(),
            x: platform.x + xOffset,
            y: platform.y + decoType.offsetY,
            sprite: decoType,
            platformId: platform.id,
          });
        }
      }
    }
  }
}
