import React from "react";
import { Navigate } from "react-router-dom";
const params = new URLSearchParams(location.search);
const status = params.get("status");
const movieId = location.pathname.split("/")[2]; // Lấy movieId từ URL
const roomId = params.get("roomId");

const PrivateRoute = ({ children, requiredRole,requiredRoles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || (requiredRole && user?.roleName !== requiredRole)) {
    return <Navigate to="/homepage" replace />;
  }

  if (!token || (requiredRoles && user?.roleName !== requiredRoles)) {
    return <Navigate to="/subscription-plans" replace />;
  }
  
  // 🚀 **Fix lỗi: Nếu vào bằng link mà có status=joined → Xóa status & về WaitingRoom**
  if (status === "joined" && document.referrer === "") {
    return <Navigate to={`/waiting?movieId=${movieId}&roomId=${roomId}`} replace />;
  }

  return children;
};

export default PrivateRoute;
