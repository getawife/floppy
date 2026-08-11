"use client";

import React, { useRef, useEffect, useState } from "react";
import { useAudio } from "../hooks/useAudio";
import { useInput } from "../hooks/useInput";
import { useGameLoop } from "../hooks/useGameLoop";
import { assetLoader } from "../game/assetLoader";
import { HIGH_SCORE_KEY } from "../game/constants";
import GameHud from "./GameHud";

export default function GameCanvas({ onWin, onLose, onCollectCoin }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const { playMusic, stopMusic, playSfx } = useAudio();

  useEffect(() => {
    const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY);
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(HIGH_SCORE_KEY, score.toString());
    }
  }, [score, highScore]);

  const imagesRef = useRef(assetLoader.loadAll());
  const engineRef = useRef(null);

  const keysRef = useInput(engineRef);

  const callbacksRef = useRef({
    onWin,
    onLose,
    onCollectCoin,
    playSfx,
    addScore: (amt) => setScore((s) => s + amt),
    addLife: () => setLives((l) => Math.min(l + 1, 5)),
    deductLife: () => {
      setLives((l) => {
        const next = l - 1;
        if (next <= 0 && callbacksRef.current.onLose)
          callbacksRef.current.onLose();
        return Math.max(0, next);
      });
    },
  });

  useEffect(() => {
    callbacksRef.current = {
      onWin,
      onLose,
      onCollectCoin,
      playSfx,
      addScore: (amt) => setScore((s) => s + amt),
      addLife: () => setLives((l) => Math.min(l + 1, 5)),
      deductLife: () => {
        setLives((l) => {
          const next = l - 1;
          if (next <= 0 && callbacksRef.current.onLose)
            callbacksRef.current.onLose();
          return Math.max(0, next);
        });
      },
    };
  }, [onWin, onLose, onCollectCoin, playSfx]);

  useEffect(() => {
    playMusic();
    return () => stopMusic();
  }, [playMusic, stopMusic]);

  useGameLoop(canvasRef, engineRef, keysRef, imagesRef, callbacksRef);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <GameHud score={score} highScore={highScore} lives={lives} />
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
