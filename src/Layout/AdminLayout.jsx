import React from 'react'
import AdminNavbar from '../components/Header/AdminNavbar';
import AdminSidebar from '../components/Sidebar/AdminSidebar';

const AdminLayout = ({ children }) => (
    <div>
      <AdminNavbar />
      <main>{children}</main>
      <AdminSidebar />
    </div>
  );

export default AdminLayout
