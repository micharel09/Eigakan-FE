import React, { Suspense, useState, useEffect } from "react";
import Navbar from "../components/Header/Navbar";
import Footer from "../components/Footer/Footer";
import { useLocation } from "react-router-dom";
import Loading from "../components/Loading/Loading";

const UserLayout = ({ children }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const isHomeScreen = location.pathname === "/homescreen";
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";
  const isWatchPage = location.pathname.includes("/watch/");

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (loading) {
    return <Loading />;
  }

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
