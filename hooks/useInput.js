import { useEffect, useRef } from "react";
import { PHYSICS } from "../game/constants";

export function useInput(engineRef) {
  const keysRef = useRef({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
      keysRef.current[e.key] = true;
      if (["ArrowUp", "w", "W", " "].includes(e.key)) {
        if (engineRef.current) {
          engineRef.current.jumpBufferTimer = PHYSICS.JUMP_BUFFER_TIME;
        }
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
      if (["ArrowUp", "w", "W", " "].includes(e.key)) {
        if (engineRef.current && engineRef.current.player.vy < -3) {
          engineRef.current.player.vy *= 0.45;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [engineRef]);

  return keysRef;
}
