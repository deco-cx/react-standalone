import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

export const render = () => {
  const element = document.getElementById("root");

  if (element === null) {
    return;
  }

  const root = ReactDOM.createRoot(element);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  return () => {
    root.unmount();
  };
};
