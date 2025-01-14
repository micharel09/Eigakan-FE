import { LogOut, Menu, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../apis/Auth/auth";

const Navbar = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateUser = () => {
      setUser(authService.getCurrentUser());
    };

    authService.addListener(updateUser);

    return () => {
      authService.removeListener(updateUser);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="max-w-6xl mx-auto flex items-center justify-between p-4 h-20 text-white">
      <div className="flex items-center gap-10 z-50">
        <Link to={"/homepage"}>
          <img src="/Eigakan-logo.png" alt="logo" className="w-32 sm:w-40" />
        </Link>

        <div className="hidden sm:flex gap-2 items-center">
          <Link to={"/"} className="hover:underline">
            Movies
          </Link>
          <Link to={"/"} className="hover:underline">
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
          <div className="flex items-center gap-2">
            <img
              src={user.picture || "/avatar2.jpg"}
              alt="Avatar"
              className="h-8 w-8 rounded-full cursor-pointer"
            />
            <span className="hidden sm:inline text-sm font-medium">
              {user.fullName}
            </span>
            <LogOut className="size-6 cursor-pointer" onClick={handleLogout} />
          </div>
        ) : (
          <Link to="/login" className="hover:underline">
            Login
          </Link>
        )}

        <div className="sm:hidden">
          <Menu className="size-6 cursor-pointer" onClick={toggleMobileMenu} />
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="bg-white w-64 h-full absolute right-0 p-4">
            <div className="flex flex-col gap-4">
              {user && (
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={user.picture || "/avatar2.jpg"}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="text-sm font-medium">{user.fullName}</span>
                </div>
              )}
              <Link
                to={"/"}
                className="hover:underline"
                onClick={toggleMobileMenu}
              >
                Movies
              </Link>
              <Link
                to={"/"}
                className="hover:underline"
                onClick={toggleMobileMenu}
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
