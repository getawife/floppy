export const HIGH_SCORE_KEY = "floppy_high_score";

export const PLATFORM_WIDTH = 140;
export const PLATFORM_HEIGHT = 20;

export const PHYSICS = {
  ACCEL: 28,
  FRICTION: 0.82,
  MAX_SPEED: 5.5,
  GRAVITY: 0.55,
  JUMP_FORCE: -12.5,
  STOMP_BOUNCE: -9.5,
  COYOTE_TIME: 0.1,
  JUMP_BUFFER_TIME: 0.12,
};

export const PLATFORM_THEMES = {
  GRASS: { name: "grass", sY: 0 },
};

export const PLATFORM_SPRITE_SPECS = {
  SMALL: { sX: 0, sWidth: 32, sHeight: 16 },
  LARGE: { sX: 32, sWidth: 48, sHeight: 16 },
};

export const MECHANICS = {
  BOUNCE_FORCE: -17,
  SLIDE_FRICTION: 0.98,
};

export const PATTERNS = [
  [
    { dx: 130, dy: -40, type: "normal", coinArc: true },
    { dx: 140, dy: -40, type: "normal", coinArc: true },
  ],
  [
    { dx: 130, dy: -80, type: "high", coinArc: true, enemy: true },
    { dx: 140, dy: 80, type: "low", coins: 3 },
  ],
  [
    { dx: 180, dy: 0, type: "normal", coins: 2 },
    { dx: 140, dy: -30, type: "normal", enemy: true },
  ],
  [
    { dx: 120, dy: 40, type: "normal" },
    { dx: 120, dy: 40, type: "normal" },
    { dx: 150, dy: 0, type: "wide", enemy: true, coins: 4 },
  ],
];

export const ASSET_PATHS = {
  knight: "/assets/sprites/knight.png",
  coin: "/assets/sprites/coin.png",
  platforms: "/assets/sprites/platforms.png",
  slimeGreen: "/assets/sprites/slime_green.png",
  sky: "/sky.png",
  worldTiles: "/assets/sprites/world_tileset.png",
  fruit: "/assets/sprites/fruit.png",
};

export const SOUND_PATHS = {
  coin: "/assets/sounds/coin.wav",
  explosion: "/assets/sounds/explosion.wav",
  hurt: "/assets/sounds/hurt.wav",
  jump: "/assets/sounds/jump.wav",
  powerUp: "/assets/sounds/power_up.wav",
  tap: "/assets/sounds/tap.wav",
};
