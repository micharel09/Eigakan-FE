import React, { Suspense } from "react";
import Navbar from "../components/Header/Navbar";
import Footer from "../components/Footer/Footer";
import { useLocation } from "react-router-dom";
import { NavbarProvider } from "../contexts/NavbarContext";

const UserLayout = ({ children }) => {
  const location = useLocation();
  const isHomeScreen = location.pathname === "/homescreen";
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";
  const isWatchPage = location.pathname.includes("/watch/");

  return (
    <NavbarProvider>
      <div>
        {!isAuthPage && <Navbar />}
        <main
          className={`
        ${!isHomeScreen && !isAuthPage ? "min-h-screen pt-20" : ""}
        ${isWatchPage ? "px-[20%]" : ""}
      `}
        >
          <Suspense
            fallback={
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
        {!isAuthPage && <Footer />}
      </div>
    </NavbarProvider>
  );
};

export default UserLayout;
