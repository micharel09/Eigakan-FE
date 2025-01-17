import React from "react";
import Navbar from "../components/Header/Navbar";
import Footer from "../components/Footer/Footer";
import { useLocation } from "react-router-dom";

const UserLayout = ({ children }) => {
  const location = useLocation();
  const isHomeScreen = location.pathname === "/homescreen";
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div>
      {!isAuthPage && <Navbar />}
      <main
        className={`
        ${!isHomeScreen && !isAuthPage ? "min-h-screen pt-20" : ""}
      `}
      >
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

export default UserLayout;
