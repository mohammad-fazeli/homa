import { HashRouter, useLocation, useNavigate } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Sidebar from "./components/Sidebar";
import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useUsersStore } from "./store/users";
import Modal from "./components/Modal";
import AttendanceOverlay from "./components/AttendanceOverlay";
import LockScreen from "./components/LockScreen";
import CommandPalette from "./components/CommandPalette";
import UserProfileModal from "./components/UserProfileModal";
import PaymentModal from "./components/finance/PaymentModal";
import WeeklyCalendar from "./components/WeeklyCalendar";
import { useAttendanceStore } from "./store/attendance";

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const kiosk = location.pathname === "/kiosk";
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const lastScan = useRef({ uid: "", at: 0 });
  const capturingUid = useUsersStore((s) => s.capturingUid);
  const pickSessionUserId = useUsersStore((s) => s.pickSessionUserId);
  const setPickSessionUserId = useUsersStore((s) => s.setPickSessionUserId);
  const addSession = useUsersStore((s) => s.addSession);
  const {
    overlay,
    pending,
    applyCard,
    confirmPending,
    setPending,
    clearOverlay,
  } = useAttendanceStore();

  useEffect(() => {
    void window.electronAPI?.settingsGet().then((settings) => {
      if (settings?.lockEnabled) setLocked(true);
    });
  }, []);

  useEffect(() => {
    const onCard = async (uid: string) => {
      if (useUsersStore.getState().capturingUid) return;
      const now = Date.now();
      if (uid === lastScan.current.uid && now - lastScan.current.at < 2500) {
        return;
      }
      lastScan.current = { uid, at: now };
      await applyCard(uid);
    };

    window.electronAPI?.ipcRenderer.on("rfid-card-present", onCard);
    return () => {
      window.electronAPI?.ipcRenderer.removeListener("rfid-card-present", onCard);
    };
  }, [applyCard]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        Boolean(target?.isContentEditable);
      const meta = e.ctrlKey || e.metaKey;

      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (e.shiftKey) {
          navigate("/kiosk");
          return;
        }
        setPaletteOpen((open) => !open);
        return;
      }
      if (meta && e.key.toLowerCase() === "n" && !typing && !capturingUid) {
        e.preventDefault();
        setPaletteOpen(false);
        navigate("/users/new");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [capturingUid, navigate]);

  return (
    <>
      <ToastContainer
        position="top-center"
        rtl
        theme="light"
        newestOnTop
        pauseOnHover
      />
      {locked && <LockScreen onUnlock={() => setLocked(false)} />}
      <div className="flex h-[calc(100vh-36px)]">
        {!kiosk && <Sidebar />}
        <main className={`flex-1 h-full overflow-y-auto w-full app-canvas ${kiosk ? "px-8 py-6" : "px-7 py-6"}`}>
          <AppRoutes />
        </main>
      </div>
      {pending && (
        <Modal onClose={() => setPending(null)}>
          <div className="relative surface-card rounded-[1.6rem] p-6 w-[28rem] max-w-[92vw] text-center space-y-4">
            <h2 className="text-lg font-bold text-ink">ثبت دستی حضور</h2>
            <p className="text-muted text-sm">{pending.message}</p>
            <div className="flex justify-center gap-3 pt-1">
              <button className="btn btn-ghost" onClick={() => setPending(null)}>
                انصراف
              </button>
              <button className="btn btn-primary" onClick={() => void confirmPending()}>
                ثبت حضور
              </button>
            </div>
          </div>
        </Modal>
      )}
      {pickSessionUserId !== null && (
        <Modal onClose={() => setPickSessionUserId(null)}>
          <div className="relative bg-surface rounded-3xl p-4 w-[min(92vw,56rem)]">
            <h2 className="text-lg font-semibold mb-3">انتخاب زمان جلسه جدید</h2>
            <WeeklyCalendar
              onAddEvent={async (date) => {
                try {
                  await addSession(pickSessionUserId, date.toISOString());
                  toast.success("جلسه اضافه شد");
                  setPickSessionUserId(null);
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "افزودن جلسه ناموفق بود"
                  );
                }
              }}
            />
          </div>
        </Modal>
      )}
      <UserProfileModal />
      <PaymentModal />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <AttendanceOverlay result={overlay} onClose={clearOverlay} />
    </>
  );
}
