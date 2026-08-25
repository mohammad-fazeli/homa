import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import WindowControls from "./components/WindowControls";
import "@fontsource/vazirmatn/arabic-400.css";
import "@fontsource/vazirmatn/arabic-700.css";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WindowControls />
    <App />
  </React.StrictMode>
);
