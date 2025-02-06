import React from "react";
import ManagerSidebar from "../components/Sidebar/ManagerSidebar";

const ManagerLayout = ({ children }) => (
  <div className="flex">
    <ManagerSidebar className="w-64 bg-gray-200 fixed top-0 left-0 bottom-0" />
    <main className="text-black flex-1 p-4 bg-slate-100">{children}</main>
  </div>
);

export default ManagerLayout;
