import React from "react";
import { RouterProvider } from "react-router-dom";
import createRouter from "./routers/createRouter";

const App = () => {
  return <RouterProvider router={createRouter()} />;
};

export default App;
