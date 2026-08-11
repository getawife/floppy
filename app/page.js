"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAudio } from "@/hooks/useAudio";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
});

export default function Home() {
  const [gameState, setGameState] = useState("IDLE");
  const { playSfx } = useAudio();

  const handleStart = () => setGameState("PLAYING");

  const handleLose = useCallback(() => {
    if (playSfx) playSfx("hurt");
    setGameState("LOST");
  }, [playSfx]);

  const handleCollectCoin = useCallback(() => {
    if (playSfx) playSfx("coin");
  }, [playSfx]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && gameState !== "PLAYING") {
        setGameState("PLAYING");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#11131c] text-white select-none">
      {gameState === "PLAYING" ? (
        <GameCanvas
          onLose={handleLose}
          onCollectCoin={handleCollectCoin}
          playSfx={playSfx}
        />
      ) : (
        <main className="absolute inset-0 flex flex-col items-center justify-center bg-[url('/sky.png')] bg-cover bg-center pixel-rendering">
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

          <div className="relative z-10 text-center space-y-6">
            {gameState === "IDLE" ? (
              <>
                <h1 className="text-6xl text-yellow-400 drop-shadow-[4px_4px_0_#a16207] pixel-font">
                  FLOPPY
                </h1>
                <button
                  onClick={handleStart}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all pixel-font cursor-pointer"
                >
                  START GAME
                </button>
                <p className="text-xs text-slate-300 pixel-font">
                  PRESS ENTER TO START
                </p>
              </>
            ) : (
              <>
                <h1 className="text-6xl text-red-500 drop-shadow-[4px_4px_0_#7f1d1d] pixel-font">
                  GAME OVER
                </h1>
                <button
                  onClick={handleStart}
                  className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all pixel-font cursor-pointer"
                >
                  TRY AGAIN
                </button>
                <p className="text-xs text-slate-300 pixel-font">
                  PRESS ENTER TO RESTART
                </p>
              </>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
