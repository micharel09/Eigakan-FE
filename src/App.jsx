import React from "react";
import { RouterProvider } from "react-router-dom";
import createRouter from "./routers/createRouter";
import WatchTogether from "./pages/WatchTogether/WatchTogether";

const App = () => {
  return <RouterProvider router={createRouter()} />;
};

export default App;
