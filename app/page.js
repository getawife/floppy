"use client";

import { useState, useEffect, useCallback } from "react";
import GameCanvas from "@/components/GameCanvas";
import PixelOverlay from "@/components/PixelOverlay";
import { useAudio } from "@/hooks/useAudio";
import TouchControls from "@/components/TouchControls";

export default function Home() {
  const [gameState, setGameState] = useState("IDLE");
  const { playWin, playLose, playCoin } = useAudio();

  const handleStart = () => setGameState("PLAYING");

  const handleWin = useCallback(() => {
    playWin();
    setGameState("WON");
  }, [playWin]);

  const handleLose = useCallback(() => {
    playLose();
    setGameState("LOST");
  }, [playLose]);

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
    <div className="relative w-screen h-screen bg-slate-950 text-white font-mono overflow-hidden select-none">
      {gameState === "PLAYING" ? (
        <>
          <GameCanvas
            onWin={handleWin}
            onLose={handleLose}
            onCollectCoin={playCoin}
          />
          <TouchControls />
        </>
      ) : (
        <PixelOverlay gameState={gameState} onStart={handleStart} />
      )}
    </div>
  );
}
