import React, { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "../components/Header/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import routes from "../routers/routes";
import { useAuth, usePath } from "../hooks";

/**
 * PersistentLayout component that maintains the navbar across page navigation
 * The Outlet component renders the current route's content
 */
const PersistentLayout = () => {
  const { role } = useAuth();
  const { currentPath, isInPath, pathStartsWith } = usePath();
  const [hideNavbarAndFooter, setHideNavbarAndFooter] = useState(false);

  // Memoize path checks
  const isWatchPage = useMemo(() => isInPath("/watch/"), [isInPath]);
  const isMoviePage = useMemo(() => isInPath("/movie/"), [isInPath]);

  // Paths that should always hide the navbar
  const AUTH_PATHS = useMemo(
    () => [
      "/login",
      "/signup",
      "/register",
      "/forgot-password",
      "/resetpassword",
      "/verify",
      "/api/Auth",
    ],
    []
  );

  // Layouts that have their own navbar
  const SPECIAL_LAYOUTS = useMemo(
    () => [
      "AdminLayout",
      "ManagerLayout",
      "PublisherLayout",
      "AdvertiserLayout",
    ],
    []
  );

  // Path prefixes that indicate specialized areas of the app
  const SPECIAL_PREFIXES = useMemo(
    () => [
      "/dashboard",
      "/admin",
      "/manager",
      "/publisher",
      "/advertiser",
      "/userRegister",
    ],
    []
  );

  // Check if path starts with any authentication path
  const isAuthPath = useCallback(
    (path) => {
      return AUTH_PATHS.some((authPath) => path.startsWith(authPath));
    },
    [AUTH_PATHS]
  );

  // Check if route has special layout
  const isSpecialLayout = useCallback(
    (route) => {
      // No layout or not a special layout
      if (!route.layout || !SPECIAL_LAYOUTS.includes(route.layout))
        return false;

      // Exact path match
      if (route.path === currentPath) return true;

      // Path with parameters
      if (route.path.includes(":")) {
        const routeParts = route.path.split("/").filter(Boolean);
        const pathParts = currentPath.split("/").filter(Boolean);

        if (routeParts.length !== pathParts.length) return false;

        return routeParts.every(
          (part, index) => part.startsWith(":") || part === pathParts[index]
        );
      }

      return false;
    },
    [currentPath, SPECIAL_LAYOUTS]
  );

  // Check for dashboard based on role
  const isDashboardForRole = useCallback(
    (path) => {
      return (
        path === "/" &&
        ["ADMIN", "MANAGER", "PUBLISHER", "ADVERTISER", "VIP MEMBER"].includes(
          role || ""
        )
      );
    },
    [role]
  );

  // Check if path has special prefix
  const hasSpecialPrefix = useCallback(
    (path) => {
      return SPECIAL_PREFIXES.some((prefix) => path.startsWith(prefix));
    },
    [SPECIAL_PREFIXES]
  );

  // Determine if navbar should be hidden
  useEffect(() => {
    // Check if navbar should be hidden for current path
    const shouldHide =
      isDashboardForRole(currentPath) ||
      isAuthPath(currentPath) ||
      routes.some(isSpecialLayout) ||
      hasSpecialPrefix(currentPath);

    setHideNavbarAndFooter(shouldHide);

    // Handle scrollbar toggle based on navbar visibility
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
  }, [
    currentPath,
    isDashboardForRole,
    isAuthPath,
    isSpecialLayout,
    hasSpecialPrefix,
  ]);

  // Apply special style for navbar on movie pages (transparent gradient)
  const navbarWrapperClass = isMoviePage ? "relative m-0 p-0" : "relative";

  return (
    <div
      className={`flex flex-col min-h-screen w-full ${
        isMoviePage ? "-mt-20" : ""
      }`}
    >
      {!hideNavbarAndFooter && (
        <div className={navbarWrapperClass}>
          {/* Gradient overlay for movie pages */}
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
