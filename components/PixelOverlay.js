"use client";

export default function PixelOverlay({ gameState, onStart }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-6">
      <div className="max-w-xl w-full bg-slate-900 border-4 border-amber-500 p-8 flex flex-col items-center text-center space-y-6 shadow-[8px_8px_0px_0px_rgba(245,158,11,0.5)]">
        <h1 className="pixel-font text-2xl md:text-3xl text-amber-400 tracking-wide leading-relaxed uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          Floppy
        </h1>

        {gameState === "IDLE" && (
          <>
            <div className="flex items-center justify-center gap-8 py-2">
              <div className="flex flex-col items-center space-y-2">
                <img
                  src="/player.svg"
                  alt="Player"
                  className="w-16 h-16 pixel-rendering"
                />
                <span className="pixel-font text-[10px] text-amber-300">
                  HERO
                </span>
              </div>
              <span className="pixel-font text-lg text-slate-500">VS</span>
              <div className="flex flex-col items-center space-y-2">
                <img
                  src="/Pixel-Guards.svg"
                  alt="Guard"
                  className="w-16 h-16 pixel-rendering"
                />
                <span className="pixel-font text-[10px] text-rose-400">
                  GUARD
                </span>
              </div>
            </div>
            <p className="pixel-font text-xs text-slate-300 leading-6 border-2 border-dashed border-slate-700 p-4 bg-slate-950">
              Collect <span className="text-amber-400">3 COINS</span> scattered
              in the maze to unlock the exit. Avoid patrolling guards!
            </p>
          </>
        )}

        {gameState === "WON" && (
          <>
            <img
              src="/player.svg"
              alt="Victorious Hero"
              className="w-20 h-20 pixel-rendering"
            />
            <h2 className="pixel-font text-lg md:text-xl text-emerald-400 leading-snug">
              YOU ESCAPED!
            </h2>
            <p className="pixel-font text-xs text-slate-300 leading-5 border-2 border-dashed border-emerald-900 p-4 bg-slate-950">
              VICTORY IS YOURS! YOU ESCAPED THE CASTLE
            </p>
          </>
        )}

        {gameState === "LOST" && (
          <>
            <img
              src="/Pixel-Guards.svg"
              alt="Defeated"
              className="w-20 h-20 pixel-rendering"
            />
            <h2 className="pixel-font text-lg md:text-xl text-rose-500 leading-snug">
              GAME OVER
            </h2>
            <p className="pixel-font text-xs text-slate-300 leading-5 border-2 border-dashed border-rose-900 p-4 bg-slate-950">
              CAUGHT BY THE GUARDS! BETTER LUCK NEXT TIME.
            </p>
          </>
        )}

        <button
          onClick={onStart}
          className="pixel-font w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-b-4 border-r-4 border-amber-700 hover:border-amber-600 active:translate-x-1 active:translate-y-1 active:border-b-0 active:border-r-0 transition-all text-xs md:text-sm uppercase tracking-wider"
        >
          PRESS ENTER TO {gameState === "IDLE" ? "START" : "RETRY"}
        </button>
      </div>
    </div>
  );
}
