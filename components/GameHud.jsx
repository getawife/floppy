import React from "react";

export default function GameHud({ score, highScore, lives }) {
  return (
    <div className="absolute top-0 left-0 p-6 pointer-events-none select-none z-10">
      <div className="text-base font-bold text-white drop-shadow pixel-font">
        <div>SCORE: {score}</div>
        <div>BEST: {highScore}</div>
      </div>
      <div className="flex gap-1.5 mt-2 drop-shadow">
        {Array.from({ length: Math.max(0, lives) }).map((_, index) => (
          <img
            key={index}
            src="/assets/icons/heart.png"
            alt="Heart"
            className="object-contain pixel-rendering"
          />
        ))}
      </div>
    </div>
  );
}
