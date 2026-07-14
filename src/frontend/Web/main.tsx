import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MainWindow } from "@web/view/MainWindow";
import "../index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <MainWindow />
  </StrictMode>,
);
