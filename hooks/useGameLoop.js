import { useEffect } from "react";
import { PhysicsEngine } from "../game/PhysicsEngine";
import { CanvasRenderer } from "../components/CanvasRenderer";

export function useGameLoop(
  canvasRef,
  engineRef,
  keysRef,
  imagesRef,
  callbacksRef,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    if (!engineRef.current) {
      engineRef.current = PhysicsEngine.createInitialState(
        canvas.width,
        canvas.height,
      );
    }

    const gameLoop = (time) => {
      const engine = engineRef.current;
      const dt = Math.min((time - engine.lastTime) / 1000, 0.05);
      engine.lastTime = time;

      PhysicsEngine.update(
        engine,
        dt,
        keysRef.current,
        canvas.width,
        canvas.height,
        callbacksRef.current,
      );

      CanvasRenderer.render(
        ctx,
        engine,
        imagesRef.current,
        canvas.width,
        canvas.height,
      );

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasRef, engineRef, keysRef, imagesRef, callbacksRef]);
}
