"use client";

import { useEffect, useRef } from "react";

export function useAudio() {
  const winAudioRef = useRef(null);
  const loseAudioRef = useRef(null);
  const coinAudioRef = useRef(null);

  useEffect(() => {
    winAudioRef.current = new Audio("/gamecomplete.wav");
    loseAudioRef.current = new Audio("/gameover.wav");
    coinAudioRef.current = new Audio("/coincollect.wav");
  }, []);

  const playSound = (audioRef) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  return {
    playWin: () => playSound(winAudioRef),
    playLose: () => playSound(loseAudioRef),
    playCoin: () => playSound(coinAudioRef),
  };
}
