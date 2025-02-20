import React from "react";
import AdminSidebar from "../../components/Sidebar/AdminSidebar";

const AdminLayout = ({ children }) => {
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default AdminLayout;
