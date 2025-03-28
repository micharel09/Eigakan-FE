import React, { Suspense, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Loading from "../components/Loading/Loading";
import Navbar from "../components/Header/Navbar";
import Footer from "../components/Footer/Footer";

/**
 * UserLayout component for regular site pages.
 * Renders navbar, content area and footer for user pages.
 */
const UserLayout = ({ children }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const isWatchPage = location.pathname.includes("/watch/");

  // Determine if this is a page using PersistentLayout for navbar
  const isPersistentNavPath =
    location.pathname === "/" ||
    location.pathname.startsWith("/homescreen") ||
    location.pathname.startsWith("/homepage") ||
    location.pathname.startsWith("/movie/") ||
    location.pathname.startsWith("/genres") ||
    location.pathname.startsWith("/people") ||
    location.pathname.startsWith("/search") ||
    location.pathname.startsWith("/news");

  useEffect(() => {
    const handleInitialLoad = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLoading(false);
    };

    handleInitialLoad();
  }, [location.pathname]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Only show navbar if not already handled by PersistentLayout */}
      {!isPersistentNavPath && <Navbar />}

      <main
        className={`flex-grow ${
          isWatchPage ? "!p-0 !m-0 h-screen w-screen" : "pt-20"
        }`}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="w-12 h-12 border-4 border-[#FF009F]/30 border-t-[#FF009F] rounded-full animate-spin" />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>

      {!isWatchPage && !isPersistentNavPath && <Footer className="mt-auto" />}
    </div>
  );
};

export default UserLayout;
