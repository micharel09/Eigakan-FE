import { LogOut, Menu, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../apis/Auth/auth";
// import useContentStore from "../store/content";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  // const { contentType, setContentType } = useContentStore();
  // console.log("contentType", contentType);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="max-w-6xl mx-auto flex items-center justify-between p-4 h-20">
      <div className="flex items-center gap-10 z-50">
        <Link to={"/"}>
          <img src="/public/avatar3.png" alt="logo" className="w-32 sm:w-40" />
        </Link>

        {/* desktop nav items */}
        <div className="hidden sm:flex gap-2 items-center">
          <Link
            to={"/"}
            className="hover:underline"
            onClick={() => setContentType("movies")}
          >
            Movies
          </Link>
          <Link
            to={"/"}
            className="hover:underline"
            onClick={() => setContentType("tv")}
          >
            TV Shows
          </Link>
          <Link to={"/favorites"} className="hover:underline">
            Favorite
          </Link>
          <Link to={"/history"} className="hover:underline">
            Search History
          </Link>
        </div>
      </div>

      <div className="flex gap-2 items-center z-50">
        <Link to={"/search"}>
          <Search className="size-6 cursor-pointer" />
        </Link>

        {user ? (
          <>
            <img
              src={user.picture || "/avatar2.jpg"}
              alt="Avatar"
              className="h-8 w-8 rounded-full cursor-pointer"
            />
            <LogOut className="size-6 cursor-pointer" onClick={handleLogout} />
          </>
        ) : (
          <Link to="/login" className="hover:underline">
            Login
          </Link>
        )}

        <div className="sm:hidden">
          <Menu className="size-6 cursor-pointer" onClick={toggleMobileMenu} />
        </div>
      </div>

      {/* mobile nav items */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="bg-white w-64 h-full absolute right-0 p-4">
            <div className="flex flex-col gap-4">
              <Link
                to={"/"}
                className="hover:underline"
                onClick={() => {
                  setContentType("movies");
                  toggleMobileMenu();
                }}
              >
                Movies
              </Link>
              <Link
                to={"/"}
                className="hover:underline"
                onClick={() => {
                  setContentType("tv");
                  toggleMobileMenu();
                }}
              >
                TV Shows
              </Link>
              <Link
                to={"/favorites"}
                className="hover:underline"
                onClick={toggleMobileMenu}
              >
                Favorite
              </Link>
              <Link
                to={"/history"}
                className="hover:underline"
                onClick={toggleMobileMenu}
              >
                Search History
              </Link>
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMobileMenu();
                  }}
                  className="hover:underline"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="hover:underline"
                  onClick={toggleMobileMenu}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
