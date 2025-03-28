import React, { useEffect, useState } from "react";
import Navbar from "../components/Header/Navbar";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import routes from "../routers/routes";

/**
 * PersistentLayout component that maintains the navbar across page navigation
 * The Outlet component renders the current route's content
 */
const PersistentLayout = () => {
  const location = useLocation();
  const [hideNavbarAndFooter, setHideNavbarAndFooter] = useState(false);
  const isWatchPage = location.pathname.includes("/watch/");
  const isMoviePage = location.pathname.includes("/movie/");

  // Paths that should always hide the navbar
  const AUTH_PATHS = [
    "/login",
    "/signup",
    "/register",
    "/forgot-password",
    "/resetpassword",
    "/verify",
    "/api/Auth",
  ];
  // Layouts that have their own navbar
  const SPECIAL_LAYOUTS = [
    "AdminLayout",
    "ManagerLayout",
    "PublisherLayout",
    "AdvertiserLayout",
  ];
  // Path prefixes that indicate specialized areas of the app
  const SPECIAL_PREFIXES = [
    "/dashboard",
    "/admin",
    "/manager",
    "/publisher",
    "/advertiser",
    "/userRegister",
  ];

  useEffect(() => {
    const path = location.pathname;

    // Check if navbar should be hidden for current path
    const shouldHide =
      // Dashboard for specific roles
      (path === "/" &&
        ["ADMIN", "MANAGER", "PUBLISHER", "ADVERTISER", "VIP MEMBER"].includes(
          localStorage.getItem("role") || ""
        )) ||
      // Authentication paths
      AUTH_PATHS.some((authPath) => path.startsWith(authPath)) ||
      // Check against route configurations
      routes.some((route) => {
        // No layout or not a special layout
        if (!route.layout || !SPECIAL_LAYOUTS.includes(route.layout))
          return false;

        // Exact path match
        if (route.path === path) return true;

        // Path with parameters
        if (route.path.includes(":")) {
          const routeParts = route.path.split("/").filter(Boolean);
          const pathParts = path.split("/").filter(Boolean);

          if (routeParts.length !== pathParts.length) return false;

          return routeParts.every(
            (part, index) => part.startsWith(":") || part === pathParts[index]
          );
        }

        return false;
      }) ||
      // Check path prefixes
      SPECIAL_PREFIXES.some((prefix) => path.startsWith(prefix));

    setHideNavbarAndFooter(shouldHide);

    // Simple scrollbar toggle based on navbar visibility
    if (!shouldHide) {
      document.documentElement.classList.add("no-scrollbar");
      document.body.classList.add("no-scrollbar");
    } else {
      document.documentElement.classList.remove("no-scrollbar");
      document.body.classList.remove("no-scrollbar");
    }

    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove("no-scrollbar");
      document.body.classList.remove("no-scrollbar");
    };
  }, [location.pathname]);

  // Áp dụng style đặc biệt cho navbar trên trang movie (transparent gradient)
  const navbarWrapperClass = isMoviePage ? "relative m-0 p-0" : "relative";

  return (
    <div
      className={`flex flex-col min-h-screen w-full ${
        isMoviePage ? "-mt-20" : ""
      }`}
    >
      {!hideNavbarAndFooter && (
        <div className={navbarWrapperClass}>
          {/* Gradient overlay cho trang movie */}
          {isMoviePage && (
            <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
              <div className="h-20 w-full">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-transparent transition-opacity duration-300 border-0 outline-none shadow-none opacity-85"></div>
              </div>
            </div>
          )}
          <Navbar />
        </div>
      )}
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      {!hideNavbarAndFooter && !isWatchPage && (
        <Footer className="mt-auto w-full" />
      )}
    </div>
  );
};

export default PersistentLayout;
