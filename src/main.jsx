import React from "react";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App";

const container = document.getElementById("root");
let root;

if (!root) {
  root = createRoot(container);
}

root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
    <Toaster position="top-right" />
  </StrictMode>
);
