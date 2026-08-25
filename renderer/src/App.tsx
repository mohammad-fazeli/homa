import { HashRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Sidebar from "./components/Sidebar";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useUsersStore } from "./store/users";
import Modal from "./components/Modal";

export default function App() {
  const [pending, setPending] = useState<{
    uid: string;
    sessionId: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    const onCard = async (uid: string) => {
      if (useUsersStore.getState().capturingUid) return;
      const result = await window.electronAPI?.useSession(uid);
      if (!result) return;
      if (result.code === "OUT_OF_TOLERANCE" && result.sessionId) {
        setPending({ uid, sessionId: result.sessionId, message: result.message });
        return;
      }
      toast(result.message, { type: result.success ? "success" : "error" });
    };

    window.electronAPI?.ipcRenderer.on("rfid-card-present", onCard);
    return () => {
      window.electronAPI?.ipcRenderer.removeListener("rfid-card-present", onCard);
    };
  }, []);

  return (
    <HashRouter>
      <ToastContainer position="top-left" rtl={true} theme="colored" />
      <div style={{ height: "calc(100vh - 36px)" }} className="flex">
        <Sidebar />
        <main className="flex-1 h-full overflow-y-scroll w-full p-8 bg-linear-to-l from-blue-100 to-purple-100">
          <AppRoutes />
        </main>
      </div>
      {pending && (
        <Modal onClose={() => setPending(null)}>
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-[28rem] space-y-4 text-center">
            <h2 className="text-lg font-semibold">ثبت دستی حضور</h2>
            <p className="text-slate-600">{pending.message}</p>
            <div className="flex justify-center gap-3">
              <button
                className="px-4 py-2 rounded-lg border"
                onClick={() => setPending(null)}
              >
                انصراف
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
                onClick={async () => {
                  const result = await window.electronAPI?.useSession(
                    pending.uid,
                    { force: true, sessionId: pending.sessionId }
                  );
                  if (result) {
                    toast(result.message, {
                      type: result.success ? "success" : "error",
                    });
                  }
                  setPending(null);
                }}
              >
                ثبت حضور
              </button>
            </div>
          </div>
        </Modal>
      )}
    </HashRouter>
  );
}
