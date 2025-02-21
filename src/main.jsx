import React from "react";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import createRouter from "./routers/createRouter";
import './index.css';


const container = document.getElementById("root");
let root;

// Kiểm tra và tạo `root` chỉ một lần
if (!root) {
  root = createRoot(container);
}

root.render(
  <StrictMode>
    <RouterProvider router={createRouter()} />
    <Toaster position="top-right" />
  </StrictMode>
);
