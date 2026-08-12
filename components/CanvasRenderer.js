import {
  PLATFORM_THEMES,
  PLATFORM_SPRITE_SPECS,
  getBiome,
} from "../game/constants";

export class CanvasRenderer {
  static render(ctx, engine, images, canvasWidth, canvasHeight) {
    const { player, camera } = engine;

    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (engine.screenShake > 0) {
      shakeOffsetX = (Math.random() - 0.5) * engine.screenShake;
      shakeOffsetY = (Math.random() - 0.5) * engine.screenShake;
      engine.screenShake *= 0.88;
      if (engine.screenShake < 0.5) engine.screenShake = 0;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const currentBiome = getBiome(camera.x + canvasWidth / 2);
    const skyImg = images[currentBiome.sky] || images.sky;

    if (skyImg?.complete && skyImg.naturalWidth !== 0) {
      const rawOffset = Math.floor(camera.x * 0.25);
      const parallaxX = ((rawOffset % canvasWidth) + canvasWidth) % canvasWidth;

      ctx.drawImage(skyImg, -parallaxX, 0, canvasWidth + 1, canvasHeight);
      ctx.drawImage(
        skyImg,
        canvasWidth - parallaxX - 1,
        0,
        canvasWidth + 1,
        canvasHeight,
      );
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      bg.addColorStop(0, "#1a1c2e");
      bg.addColorStop(1, "#0f101d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.save();
    ctx.translate(
      -Math.floor(camera.x) + shakeOffsetX,
      -Math.floor(camera.y) + shakeOffsetY,
    );

    if (engine.decorations && images.worldTiles?.complete) {
      engine.decorations.forEach((deco) => {
        const { sprite } = deco;
        ctx.drawImage(
          images.worldTiles,
          sprite.sx,
          sprite.sy,
          sprite.sw,
          sprite.sh,
          deco.x,
          deco.y,
          sprite.sw,
          sprite.sh,
        );
      });
    }

    engine.platforms.forEach((plat) => {
      if (images.platforms?.complete && images.platforms.naturalWidth !== 0) {
        const themeKey = (plat.theme || "GRASS").toUpperCase();
        const sY = PLATFORM_THEMES[themeKey]?.sY ?? 0;

        const tileWidth = 16;
        const totalTiles = Math.max(1, Math.round(plat.width / tileWidth));

        const leftX = PLATFORM_SPRITE_SPECS?.LEFT?.sX ?? 0;
        const midX = PLATFORM_SPRITE_SPECS?.MID?.sX ?? 16;
        const rightX = PLATFORM_SPRITE_SPECS?.RIGHT?.sX ?? 32;

        for (let i = 0; i < totalTiles; i++) {
          let srcX = midX;
          if (i === 0) srcX = leftX;
          else if (i === totalTiles - 1) srcX = rightX;

          ctx.drawImage(
            images.platforms,
            srcX,
            sY,
            16,
            16,
            plat.x + i * 16,
            plat.y,
            16,
            16,
          );
        }
      } else {
        ctx.fillStyle = plat.isMoving ? "#e17055" : "#00b894";
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      }
    });

    if (engine.mushrooms && images.fruit?.complete) {
      engine.mushrooms.forEach((shroom) => {
        ctx.drawImage(
          images.fruit,
          0,
          0,
          16,
          16,
          shroom.x,
          shroom.y,
          shroom.width,
          shroom.height,
        );
      });
    }

    if (engine.fruits && images.fruit?.complete) {
      engine.fruits.forEach((fruit) => {
        if (fruit.collected) return;
        const frameX = (fruit.type || 0) * 16;
        ctx.drawImage(
          images.fruit,
          frameX,
          0,
          16,
          16,
          fruit.x,
          fruit.y,
          16,
          16,
        );
      });
    }

    const coinImg = images.coin;
    const coinFrame = Math.floor(engine.globalTimer / 6) % 12;
    engine.coins.forEach((coin) => {
      if (!coin.collected) {
        if (coinImg?.complete) {
          ctx.drawImage(
            coinImg,
            coinFrame * 16,
            0,
            16,
            16,
            coin.x,
            coin.y,
            24,
            24,
          );
        } else {
          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.arc(coin.x + 12, coin.y + 12, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    const slimeSprite = images.slimeGreen;
    const sFrame = Math.floor(engine.globalTimer / 10) % 4;
    engine.enemies.forEach((enemy) => {
      if (slimeSprite?.complete && slimeSprite.naturalWidth !== 0) {
        ctx.drawImage(
          slimeSprite,
          sFrame * 24,
          0,
          24,
          24,
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height,
        );
      } else {
        ctx.fillStyle = "#00ff7f";
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      }
    });

    engine.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.016;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    engine.particles = engine.particles.filter((p) => p.life > 0);

    const knightImg = images.knight;
    if (
      player.invulnerableTimer <= 0 ||
      Math.floor(engine.globalTimer / 4) % 2 === 0
    ) {
      if (knightImg?.complete) {
        let row = 0;
        let totalFrames = 4;

        if (player.action === "run") {
          row = 2;
          totalFrames = 8;
        }

        player.animTimer++;
        if (player.animTimer % 6 === 0) {
          player.animFrame = (player.animFrame + 1) % totalFrames;
        }

        ctx.save();
        if (player.facingLeft) {
          ctx.translate(player.x + player.width + 8, player.y - 8);
          ctx.scale(-1, 1);
          ctx.drawImage(
            knightImg,
            player.animFrame * 32,
            row * 32,
            32,
            32,
            0,
            0,
            36,
            36,
          );
        } else {
          ctx.drawImage(
            knightImg,
            player.animFrame * 32,
            row * 32,
            32,
            32,
            player.x - 6,
            player.y - 6,
            36,
            36,
          );
        }
        ctx.restore();
      } else {
        ctx.fillStyle = "#6c5ce7";
        ctx.fillRect(player.x, player.y, player.width, player.height);
      }
    }

    ctx.restore();
  }
}
