import { useEffect, useRef, useState, useCallback } from "react";

const SFX_PATHS = {
  coin: "/assets/sounds/coin.wav",
  explosion: "/assets/sounds/explosion.wav",
  hurt: "/assets/sounds/hurt.wav",
  jump: "/assets/sounds/jump.wav",
  powerUp: "/assets/sounds/power_up.wav",
  tap: "/assets/sounds/tap.wav",
};

export const useAudio = () => {
  const musicRef = useRef(null);
  const sfxBuffers = useRef({});

  useEffect(() => {
    const music = new Audio("/assets/music/time_for_adventure.mp3");
    music.loop = true;
    music.volume = 0.4;
    musicRef.current = music;

    Object.entries(SFX_PATHS).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = "auto";
      sfxBuffers.current[key] = audio;
    });

    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, []);

  const playMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.loop = true;
      musicRef.current.play().catch(() => {});
    }
  }, []);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  }, []);

  const playSfx = useCallback((name) => {
    if (!sfxBuffers.current[name]) return;
    const sound = sfxBuffers.current[name].cloneNode();
    sound.volume = 0.6;
    sound.play().catch(() => {});
  }, []);

  return { playMusic, stopMusic, playSfx };
};
