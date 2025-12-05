import { Minus, Square, X } from "lucide-react";

export default function WindowControls() {
  return (
    <>
      <div
        dir="ltr"
        className="
      fixed w-full h-9 z-50
        flex items-center justify-end gap-1 
        bg-white/80 backdrop-blur-md 
        border-b border-slate-300 
        select-none
      "
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        {/* Minimize */}
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="
          w-10 h-9 flex items-center justify-center 
         hover:bg-neutral-200 
          transition-all
        "
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <Minus size={14} />
        </button>

        {/* Maximize */}
        <button
          onClick={() => window.electronAPI?.maximize()}
          className="
          w-10 h-9 flex items-center justify-center 
         hover:bg-neutral-200 
          transition-all
        "
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <Square size={13} />
        </button>

        {/* Close */}
        <button
          onClick={() => window.electronAPI?.close()}
          className="
          w-10 h-9 flex items-center justify-center 
         transition-all
          hover:bg-red-500 hover:text-white
        "
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <X size={14} />
        </button>
      </div>
      <div className="w-full h-9"></div>
    </>
  );
}
