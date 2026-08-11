import { PHYSICS, MECHANICS } from "./constants";
import { LevelGenerator } from "./LevelGenerator";

export class PhysicsEngine {
  static createInitialState(canvasWidth, canvasHeight) {
    const initialSpawnX = 100;
    const startPlatformY = canvasHeight - 180;

    const startPlatform = {
      id: 1,
      x: initialSpawnX - 40,
      y: startPlatformY,
      width: 220,
      height: 20,
      isMoving: false,
      hasEnemy: false,
    };

    const engine = {
      player: {
        x: initialSpawnX,
        y: startPlatformY - 24,
        width: 24,
        height: 24,
        vx: 0,
        vy: 0,
        grounded: true,
        facingLeft: false,
        action: "idle",
        animFrame: 0,
        animTimer: 0,
        invulnerableTimer: 0,
        speedBoostTimer: 0,
        jumpBoostTimer: 0,
        lastSafePlatform: startPlatform,
      },
      camera: { x: 0, y: 0, lookAhead: 0 },
      platforms: [startPlatform],
      coins: [],
      mushrooms: [],
      fruits: [],
      enemies: [],
      particles: [],
      nextPlatformId: 2,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      screenShake: 0,
      globalTimer: 0,
      lastTime: performance.now(),
    };

    for (let i = 0; i < 5; i++) {
      LevelGenerator.generateChunk(engine, canvasHeight);
    }

    return engine;
  }

  static getSafeRespawnPlatform(engine) {
    // Check if recorded last safe platform is still valid & visible
    const lastPlat = engine.platforms.find(
      (p) => p.id === engine.player.lastSafePlatform?.id && !p.isMoving,
    );
    if (lastPlat) return lastPlat;

    // Fallback: find closest stable static platform behind player
    const validPlatforms = engine.platforms.filter(
      (p) => !p.isMoving && p.x <= engine.player.x,
    );

    if (validPlatforms.length > 0) {
      return validPlatforms[validPlatforms.length - 1];
    }

    return engine.platforms[0];
  }

  static spawnParticles(engine, x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      engine.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.8) * 4,
        color,
        life: 0.3 + Math.random() * 0.2,
        size: 2 + Math.random() * 3,
      });
    }
  }

  static update(engine, dt, keys, canvasWidth, canvasHeight, callbacks) {
    engine.globalTimer++;
    const { player, camera } = engine;

    while (
      engine.platforms[engine.platforms.length - 1].x <
      camera.x + canvasWidth + 400
    ) {
      LevelGenerator.generateChunk(engine, canvasHeight);
    }

    engine.platforms = engine.platforms.filter(
      (p) => p.x + p.width > camera.x - 400,
    );
    engine.coins = engine.coins.filter(
      (c) => c.x > camera.x - 400 && !c.collected,
    );
    if (engine.mushrooms) {
      engine.mushrooms = engine.mushrooms.filter((m) => m.x > camera.x - 400);
    }
    if (engine.fruits) {
      engine.fruits = engine.fruits.filter(
        (f) => f.x > camera.x - 400 && !f.collected,
      );
    }
    engine.enemies = engine.enemies.filter((e) => e.x > camera.x - 400);

    if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;
    if (player.speedBoostTimer > 0) player.speedBoostTimer -= dt;
    if (player.jumpBoostTimer > 0) player.jumpBoostTimer -= dt;

    if (engine.coyoteTimer > 0) engine.coyoteTimer -= dt;
    if (engine.jumpBufferTimer > 0) engine.jumpBufferTimer -= dt;

    let moveDir = 0;
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
      moveDir = -1;
      player.facingLeft = true;
      player.action = "run";
    } else if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
      moveDir = 1;
      player.facingLeft = false;
      player.action = "run";
    } else {
      player.action = "idle";
    }

    const currentMaxSpeed =
      player.speedBoostTimer > 0 ? PHYSICS.MAX_SPEED * 1.5 : PHYSICS.MAX_SPEED;

    if (moveDir !== 0) {
      player.vx += moveDir * PHYSICS.ACCEL * dt;
      player.vx = Math.max(
        -currentMaxSpeed,
        Math.min(currentMaxSpeed, player.vx),
      );
    } else {
      player.vx *= PHYSICS.FRICTION;
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    if (player.grounded) {
      engine.coyoteTimer = PHYSICS.COYOTE_TIME;
    }

    if (engine.jumpBufferTimer > 0 && engine.coyoteTimer > 0) {
      const currentJumpForce =
        player.jumpBoostTimer > 0
          ? PHYSICS.JUMP_FORCE * 1.25
          : PHYSICS.JUMP_FORCE;

      player.vy = currentJumpForce;
      player.grounded = false;
      engine.coyoteTimer = 0;
      engine.jumpBufferTimer = 0;
      callbacks.playSfx("jump");
      this.spawnParticles(
        engine,
        player.x + player.width / 2,
        player.y + player.height,
        "#ffffff",
        4,
      );
    }

    player.vy += PHYSICS.GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    engine.platforms.forEach((plat) => {
      if (plat.isMoving) {
        plat.x += plat.moveSpeed * plat.moveDir;
        if (Math.abs(plat.x - plat.startX) > plat.moveRange) {
          plat.moveDir *= -1;
        }
      }
    });

    player.grounded = false;
    engine.platforms.forEach((plat) => {
      if (
        player.x + player.width > plat.x &&
        player.x < plat.x + plat.width &&
        player.y + player.height >= plat.y &&
        player.y + player.height <= plat.y + 12 &&
        player.vy >= 0
      ) {
        player.y = plat.y - player.height;
        player.vy = 0;
        player.grounded = true;

        if (!plat.isMoving) {
          player.lastSafePlatform = plat;
        } else {
          player.x += plat.moveSpeed * plat.moveDir;
        }
      }
    });

    if (engine.mushrooms) {
      engine.mushrooms.forEach((shroom) => {
        if (
          player.x + player.width > shroom.x &&
          player.x < shroom.x + shroom.width &&
          player.y + player.height >= shroom.y &&
          player.y + player.height <= shroom.y + 12 &&
          player.vy > 0
        ) {
          player.vy = MECHANICS?.BOUNCE_FORCE || -17;
          player.grounded = false;
          callbacks.playSfx("jump");
          this.spawnParticles(engine, shroom.x + 8, shroom.y + 8, "#ff7675", 8);
        }
      });
    }

    engine.enemies.forEach((enemy) => {
      enemy.vy += PHYSICS.GRAVITY;
      const currentPlat = engine.platforms.find(
        (p) => p.id === enemy.platformId,
      );
      const distToPlayer = player.x - enemy.x;

      if (
        currentPlat &&
        Math.abs(distToPlayer) < 250 &&
        Math.abs(player.y - enemy.y) < 60
      ) {
        enemy.vx = distToPlayer > 0 ? enemy.speed : -enemy.speed;
      } else if (currentPlat) {
        if (enemy.x <= currentPlat.x) {
          enemy.vx = enemy.speed;
        } else if (enemy.x + enemy.width >= currentPlat.x + currentPlat.width) {
          enemy.vx = -enemy.speed;
        }
      }

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      enemy.grounded = false;
      engine.platforms.forEach((plat) => {
        if (
          enemy.x + enemy.width > plat.x &&
          enemy.x < plat.x + plat.width &&
          enemy.y + enemy.height >= plat.y &&
          enemy.y + enemy.height <= plat.y + 12 &&
          enemy.vy >= 0
        ) {
          enemy.y = plat.y - enemy.height;
          enemy.vy = 0;
          enemy.grounded = true;
        }
      });

      if (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
      ) {
        const isStomping =
          player.vy > 0 && player.y + player.height - player.vy <= enemy.y + 12;

        if (isStomping) {
          player.vy = PHYSICS.STOMP_BOUNCE;
          enemy.dead = true;
          callbacks.playSfx("explosion");
          this.spawnParticles(
            engine,
            enemy.x + 12,
            enemy.y + 12,
            "#00ff7f",
            10,
          );
          callbacks.addScore(200);
        } else if (player.invulnerableTimer <= 0) {
          callbacks.playSfx("hurt");
          player.invulnerableTimer = 1.2;
          player.vx = enemy.vx > 0 ? 6 : -6;
          player.vy = -6;
          engine.screenShake = 10;
          callbacks.deductLife();
        }
      }
    });

    engine.enemies = engine.enemies.filter((e) => !e.dead);

    engine.coins.forEach((coin) => {
      if (
        !coin.collected &&
        player.x < coin.x + 24 &&
        player.x + player.width > coin.x &&
        player.y < coin.y + 24 &&
        player.y + player.height > coin.y
      ) {
        coin.collected = true;
        this.spawnParticles(engine, coin.x + 12, coin.y + 12, "#ffd700", 6);
        callbacks.playSfx("coin");
        if (callbacks.onCollectCoin) callbacks.onCollectCoin();
        callbacks.addScore(100);
      }
    });

    if (engine.fruits) {
      engine.fruits.forEach((fruit) => {
        if (
          !fruit.collected &&
          player.x < fruit.x + 16 &&
          player.x + player.width > fruit.x &&
          player.y < fruit.y + 16 &&
          player.y + player.height > fruit.y
        ) {
          fruit.collected = true;
          callbacks.playSfx("powerUp");
          callbacks.addScore(300);

          switch (fruit.type) {
            case 0:
              if (callbacks.addLife) callbacks.addLife();
              break;
            case 1:
              player.invulnerableTimer = Math.max(
                player.invulnerableTimer,
                5.0,
              );
              break;
            case 2:
              player.speedBoostTimer = 6.0;
              break;
            case 3:
              player.jumpBoostTimer = 6.0;
              break;
          }

          this.spawnParticles(engine, fruit.x + 8, fruit.y + 8, "#ff7675", 10);
        }
      });
    }

    // Void / Fall Check
    if (player.y > camera.y + canvasHeight + 150) {
      callbacks.playSfx("hurt");
      const respawnPlat = this.getSafeRespawnPlatform(engine);

      player.x = respawnPlat.x + respawnPlat.width / 2 - player.width / 2;
      player.y = respawnPlat.y - player.height - 10;
      player.vx = 0;
      player.vy = 0;
      player.invulnerableTimer = 1.0;
      callbacks.deductLife();
    }

    const targetLookAhead = player.vx * 20;
    camera.lookAhead += (targetLookAhead - camera.lookAhead) * 0.05;
    const targetCamX = player.x - canvasWidth * 0.35 + camera.lookAhead;
    const targetCamY = player.y - canvasHeight * 0.55;

    camera.x += (targetCamX - camera.x) * 0.08;
    camera.y += (targetCamY - camera.y) * 0.05;
  }
}
