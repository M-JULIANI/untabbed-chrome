import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "./components/ui/toaster";
import { HoveredProvider } from "./contexts/HoveredContext";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No root element found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HoveredProvider>
      <App />
    </HoveredProvider>
    <Toaster />
  </React.StrictMode>,
);
