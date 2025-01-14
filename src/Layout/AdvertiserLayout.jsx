import React from 'react'
import AdvertiserNavbar from '../components/Header/AdvertiserNavbar';
import AdminSidebar from '../components/Sidebar/AdminSidebar';

const AdvertiserLayout = ({ children }) => (
    <div>
      <AdvertiserNavbar />
      <main>{children}</main>
      <AdminSidebar />
    </div>
  );


export default AdvertiserLayout
