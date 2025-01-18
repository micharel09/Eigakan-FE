import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";

const navLinks = [
  { path: "/homescreen", label: "Movies" },
  { path: "/", label: "TV Shows" },
  { path: "/favorites", label: "Favorite" },
  { path: "/people", label: "Popular People" },
  { path: "/history", label: "Search History" },
];

const Navbar = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const updateUser = () => setUser(authService.getCurrentUser());
    authService.addListener(updateUser);
    return () => authService.removeListener(updateUser);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${
          isScrolled
            ? "bg-black/80 backdrop-blur-sm shadow-lg"
            : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-20 text-white">
        <Link
          to="/homepage"
          className="relative z-10 transform hover:scale-105 transition-transform duration-200"
        >
          <img src="/Eigakan-logo.png" alt="logo" className="w-32 sm:w-40" />
        </Link>

        <nav className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative py-2 text-sm font-medium transition-colors group
                ${
                  location.pathname === link.path
                    ? "text-red-500"
                    : "text-white hover:text-red-400"
                }`}
            >
              {link.label}
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transform scale-x-0 
                transition-transform duration-300 group-hover:scale-x-100
                ${location.pathname === link.path ? "scale-x-100" : ""}`}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <SearchBar navigate={navigate} />
          {user ? (
            <ProfileMenu
              user={user}
              showProfileMenu={showProfileMenu}
              handleLogout={() => {
                authService.logout();
                navigate("/login");
              }}
              handleProfileClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
            />
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 rounded-full bg-red-500 hover:bg-red-600 
              transition-all duration-200 text-sm font-medium transform hover:scale-105 
              active:scale-95 shadow-lg hover:shadow-red-500/25"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
