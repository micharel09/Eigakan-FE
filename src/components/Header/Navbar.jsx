import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";
import { CrownOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
const navLinks = [
  { path: "/homescreen", label: "Movies" },
  { path: "/", label: "TV Shows" },
  { path: "/favorites", label: "Favorite" },
  { path: "/people", label: "Popular People" },
  { path: "/news", label: "News" },
  { path: "/history", label: "Search History" },
];

const Navbar = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const isManager = role === "MANAGER";
  const isAdmin = role === "ADMIN";
  const isInManagerPage = location.pathname.includes("/manager");
  const isInAdminPage =
    location.pathname.includes("/dashboard") ||
    location.pathname.includes("/userRegister");
  const isVipMember = role === "VIP MEMBER";

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

  useEffect(() => {
    // Lắng nghe sự kiện role thay đổi
    const handleRoleChange = () => {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    };

    window.addEventListener('userRoleChanged', handleRoleChange);

    return () => {
      window.removeEventListener('userRoleChanged', handleRoleChange);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none"></div>
      <div className="relative max-w-[1300px] mx-auto px-4">
        <div className="flex items-center justify-between h-20">
        <Link to="/homepage" className="relative z-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="eigakan-gradient  text-[#FF009F] font-bold text-2xl "
      >
        EIGAKAN
      </motion.div>
    </Link>
          <div className="flex-1 max-w-3xl mx-8">
            <nav className="flex items-center justify-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-2 text-sm font-medium transition-colors group whitespace-nowrap
                    ${
                      location.pathname === link.path
                        ? "text-[#FF009F]"
                        : "text-gray-300 hover:text-[#FF009F]"
                    }`}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#FF009F] transform scale-x-0 
                    transition-transform duration-300 group-hover:scale-x-100
                    ${location.pathname === link.path ? "scale-x-100" : ""}`}
                  />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 min-w-[200px] justify-end">
            <SearchBar navigate={navigate} />
            {user ? (
              <>
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
                {!isVipMember && (
                  <Link
                  to="/subscription-plans"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                    text-[#FF009F] hover:text-white border border-[#FF009F] transition-all
                    duration-300 ease-in-out shadow-md 
                    hover:bg-[#FF009F] hover:shadow-[0_0_15px_#FF009F]"
                >
                  <CrownOutlined />
                  <span>Upgrade Plan</span>
                </Link>
                
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 rounded-full bg-[#FF009F] hover:bg-[#D1007F] 
                transition-all duration-200 text-sm font-medium transform hover:scale-105"
              >
                Login
              </Link>
            )}
          </div>

          {(isManager || isAdmin) && (
            <div className="flex items-center ml-4">
              <Link
                to={
                  isManager
                    ? isInManagerPage
                      ? "/homescreen"
                      : "/manager/dashboard"
                    : isInAdminPage
                    ? "/homescreen"
                    : "/dashboard"
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg 
                  text-sm font-medium transition-colors duration-200
                  border border-[#FF009F]/20
                  hover:bg-[#FF009F]/10 text-[#FF009F]"
              >
                {isManager ? (
                  isInManagerPage ? (
                    <>
                      <span>View User Site</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Manager Dashboard</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </>
                  )
                ) : isInAdminPage ? (
                  <>
                    <span>View User Site</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>Admin Dashboard</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
