import { HashRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Sidebar from "./components/Sidebar";
import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";

export default function App() {
  const cb = async (e: string) => {
    const result = await window.electronAPI?.useSession(e);
    toast(result?.message, {
      type: result?.success ? "success" : "error",
    });
  };
  useEffect(() => {
    window.electronAPI?.ipcRenderer.on("rfid-card-present", cb);

    return () => {
      window.electronAPI?.ipcRenderer.removeListener("rfid-card-present", cb);
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
