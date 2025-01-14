import React from 'react'
import Navbar from '../components/Header/Navbar';
import Footer from '../components/Footer/Footer';

const UserLayout = ({ children }) => (
    <div>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );

export default UserLayout
