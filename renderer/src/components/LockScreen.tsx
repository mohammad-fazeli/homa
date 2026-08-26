import { useState } from "react";
import { toast } from "react-toastify";

export default function LockScreen({
  onUnlock,
}: {
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const ok = await window.electronAPI?.settingsVerifyPin(pin);
      if (ok) onUnlock();
      else {
        toast.error("رمز نادرست است");
        setPin("");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-shell text-white flex items-center justify-center">
      <div className="w-[22rem] text-center space-y-5">
        <div>
          <div className="text-gold text-sm mb-1">هما</div>
          <h1 className="text-2xl font-bold">قفل برنامه</h1>
          <p className="text-white/55 text-sm mt-2">رمز ۴ رقمی را وارد کنید</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          className="w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-3 text-center text-xl tracking-[0.5em]"
          autoFocus
        />
        <button className="btn btn-primary w-full" disabled={busy} onClick={() => void submit()}>
          ورود
        </button>
      </div>
    </div>
  );
}
