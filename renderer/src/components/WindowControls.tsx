import { Minus, Square, X } from "lucide-react";

export default function WindowControls() {
  return (
    <>
      <div
        dir="ltr"
        className="fixed w-full h-9 z-40 flex items-center justify-end bg-shell text-white/90 border-b border-white/10 select-none"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold tracking-wide"
          dir="rtl"
        >
          هما
          <span className="mr-2 text-[11px] font-normal text-white/45">
            مدیریت آموزشگاه
          </span>
        </div>
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="w-11 h-9 flex items-center justify-center hover:bg-white/10 transition"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => window.electronAPI?.maximize()}
          className="w-11 h-9 flex items-center justify-center hover:bg-white/10 transition"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => window.electronAPI?.close()}
          className="w-11 h-9 flex items-center justify-center hover:bg-danger hover:text-white transition"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <X size={14} />
        </button>
      </div>
      <div className="w-full h-9" />
    </>
  );
}
