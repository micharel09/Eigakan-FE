import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children, requiredRole, requiredRoles }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const status = params.get("status");
  const movieId = location.pathname.split("/")[2];
  const roomId = params.get("roomId");

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (error) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.roleName !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user.roleName !== requiredRoles) {
    return <Navigate to="/login" replace />;
  }

  if (status === "joined" && document.referrer === "") {
    return (
      <Navigate to={`/waiting?movieId=${movieId}&roomId=${roomId}`} replace />
    );
  }

  return children;
};

export default PrivateRoute;
