import React from "react";

export default function GameHud({ score, highScore, lives }) {
  return (
    <div className="absolute top-0 left-0 p-6 pointer-events-none select-none z-10">
      <div className=" text-base font-bold text-white drop-shadow">
        <div>SCORE: {score}</div>
        <div>BEST: {highScore}</div>
      </div>
      <div className="text-3xl text-red-500 mt-2 tracking-widest drop-shadow">
        {"♥".repeat(lives)}
      </div>
    </div>
  );
}
