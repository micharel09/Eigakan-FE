import React from 'react'
import AdminSidebar from '../components/Sidebar/AdminSidebar';

const AdminLayout = ({ children }) => (
    <div className="flex">
        <AdminSidebar className="w-64 bg-gray-200 fixed top-0 left-0 bottom-0" />
        <main className=" text-black flex-1 p-4 bg-slate-100" >{children}</main>
    </div>

  );

export default AdminLayout
