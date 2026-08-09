"use client";

export default function TouchControls({ onDirectionChange }) {
  const handleTouch = (key, isPressed) => {
    window.dispatchEvent(
      new KeyboardEvent(isPressed ? "keydown" : "keyup", { key }),
    );
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 grid grid-cols-3 gap-2 md:hidden z-50">
      <div />
      <button
        onTouchStart={() => handleTouch("ArrowUp", true)}
        onTouchEnd={() => handleTouch("ArrowUp", false)}
        className="w-14 h-14 bg-slate-800 border-2 border-amber-500 rounded text-white font-bold active:bg-amber-500 active:text-slate-950"
      >
        ▲
      </button>
      <div />
      <button
        onTouchStart={() => handleTouch("ArrowLeft", true)}
        onTouchEnd={() => handleTouch("ArrowLeft", false)}
        className="w-14 h-14 bg-slate-800 border-2 border-amber-500 rounded text-white font-bold active:bg-amber-500 active:text-slate-950"
      >
        ◀
      </button>
      <button
        onTouchStart={() => handleTouch("ArrowDown", true)}
        onTouchEnd={() => handleTouch("ArrowDown", false)}
        className="w-14 h-14 bg-slate-800 border-2 border-amber-500 rounded text-white font-bold active:bg-amber-500 active:text-slate-950"
      >
        ▼
      </button>
      <button
        onTouchStart={() => handleTouch("ArrowRight", true)}
        onTouchEnd={() => handleTouch("ArrowRight", false)}
        className="w-14 h-14 bg-slate-800 border-2 border-amber-500 rounded text-white font-bold active:bg-amber-500 active:text-slate-950"
      >
        ▶
      </button>
    </div>
  );
}
