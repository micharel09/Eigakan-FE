import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ManagerSidebar from "../components/Sidebar/ManagerSidebar";
import Loading from "../components/Loading/Loading";

const ManagerLayout = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <ManagerSidebar />
      <main>{children}</main>
    </div>
  );
};

export default ManagerLayout;
