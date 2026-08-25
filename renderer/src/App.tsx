import { HashRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Sidebar from "./components/Sidebar";
import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useUsersStore } from "./store/users";

export default function App() {
  useEffect(() => {
    const onCard = async (uid: string) => {
      if (useUsersStore.getState().capturingUid) return;
      const result = await window.electronAPI?.useSession(uid);
      if (!result) return;
      toast(result.message, {
        type: result.success ? "success" : "error",
      });
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
    </HashRouter>
  );
}
