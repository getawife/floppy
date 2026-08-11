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
  const [isMuted, setIsMuted] = useState(false);
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
      if (!isMuted) {
        musicRef.current.play().catch(() => {});
      }
    }
  }, [isMuted]);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  }, []);

  const playSfx = useCallback(
    (name) => {
      if (isMuted || !sfxBuffers.current[name]) return;
      const sound = sfxBuffers.current[name].cloneNode();
      sound.volume = 0.6;
      sound.play().catch(() => {});
    },
    [isMuted],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextState = !prev;
      if (musicRef.current) {
        musicRef.current.muted = nextState;
      }
      return nextState;
    });
  }, []);

  return { playMusic, stopMusic, playSfx, toggleMute, isMuted };
};
