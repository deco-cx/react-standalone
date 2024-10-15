import React from "react";
import ReactDOM from "react-dom/client";
import Router from "./routes.tsx";

const element = document.getElementById("root");

if (element instanceof HTMLElement) {
  const root = ReactDOM.createRoot(element);
  root.render(<Router />);
}
