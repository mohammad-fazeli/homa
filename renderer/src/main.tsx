import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import WindowControls from "./components/WindowControls";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WindowControls />
    <App />
  </React.StrictMode>
);
