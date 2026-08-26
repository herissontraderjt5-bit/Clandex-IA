import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent cross-origin third-party script/iframe events from polluting error overlay
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (
      event.message === "Script error." ||
      event.message?.includes("ResizeObserver") ||
      event.message?.includes("postMessage")
    ) {
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

