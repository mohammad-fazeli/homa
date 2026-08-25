import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import WindowControls from "./components/WindowControls";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WindowControls />
    <App />
  </React.StrictMode>
);
