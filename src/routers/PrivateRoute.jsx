import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || (requiredRole && user?.roleName !== requiredRole)) {
    return <Navigate to="/homepage" replace />;
  }

  return children;
};

export default PrivateRoute;
