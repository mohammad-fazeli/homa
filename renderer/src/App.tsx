import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ height: "calc(100vh - 36px)" }} className="flex">
        <Sidebar />
        <main className="flex-1 h-full overflow-y-scroll w-full p-8 pt-12 bg-linear-to-l from-blue-100 to-purple-100">
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
