import React from "react";
import "./index.css";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import createRouter from './routers';

const container = document.getElementById('root');
let root;

// Kiểm tra và tạo `root` chỉ một lần
if (!root) {
  root = createRoot(container);
}

root.render(
  <StrictMode>
    <RouterProvider router={createRouter()} />
  </StrictMode>,
);
