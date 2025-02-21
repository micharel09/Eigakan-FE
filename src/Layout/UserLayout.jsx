import React, { Suspense } from "react";
import Navbar from "../components/Header/Navbar";
import Footer from "../components/Footer/Footer";
import { useLocation } from "react-router-dom";

const UserLayout = ({ children }) => {
  const location = useLocation();
  const isHomeScreen = location.pathname === "/homescreen";
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";
  const isWatchPage = location.pathname.includes("/watch/");

  return (
    <div className="flex flex-col min-h-screen ">
      {!isHomeScreen && !isAuthPage && <Navbar />}
      <main
        className={`
          flex-grow
          ${!isHomeScreen && !isAuthPage ? "pt-20" : ""}
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
      {!isAuthPage && <Footer className="mt-auto" />}
    </div>
  );
};

export default UserLayout;
