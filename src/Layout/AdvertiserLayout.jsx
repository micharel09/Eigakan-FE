import React from "react";
import { useLocation } from "react-router-dom";
import AdvertiserSidebar from "../components/Sidebar/AdvertiserSidebar";

const AdvertiserLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdvertiserSidebar />
      <main className="flex-1 ml-56 p-8 bg-gray-100">{children}</main>
    </div>
  );
};

export default AdvertiserLayout;
