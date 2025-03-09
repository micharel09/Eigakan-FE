import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";
import { CrownOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Film,
  User,
  Home,
  Search,
  Users,
  Newspaper,
  Bookmark,
  Clock,
  TrendingUp,
} from "lucide-react";

const navLinks = [
  { path: "/homescreen", label: "Movies", icon: <Film className="w-4 h-4" /> },
  {
    path: "/genres",
    label: "Genres",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  { path: "/", label: "TV Shows", icon: <Home className="w-4 h-4" /> },
  {
    path: "/favorites",
    label: "Favorite",
    icon: <Bookmark className="w-4 h-4" />,
  },
  {
    path: "/people",
    label: "Popular People",
    icon: <Users className="w-4 h-4" />,
  },
  { path: "/news", label: "News", icon: <Newspaper className="w-4 h-4" /> },
  {
    path: "/history",
    label: "Search History",
    icon: <Clock className="w-4 h-4" />,
  },
];

const Navbar = () => {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.roleName || localStorage.getItem("role");
  const isManager = role === "MANAGER";
  const isAdmin = role === "ADMIN";
  const isPublisher = role === "PUBLISHER";
  const isInManagerPage = location.pathname.includes("/manager");
  const isInAdminPage =
    location.pathname.includes("/dashboard") ||
    location.pathname.includes("/userRegister");
  const isInPublisherPage = location.pathname.includes("/publisher");
  const isVipMember = role === "VIP MEMBER";
  const token = localStorage.getItem("token");
  const isAdvertiser = role === "ADVERTISER";
  const isInAdvertiserPage = location.pathname.includes("/advertiser");

  useEffect(() => {
    const updateUser = () => setUser(authService.getCurrentUser());
    authService.addListener(updateUser);
    return () => authService.removeListener(updateUser);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Lắng nghe sự kiện role thay đổi
    const handleRoleChange = () => {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    };

    window.addEventListener("userRoleChanged", handleRoleChange);

    return () => {
      window.removeEventListener("userRoleChanged", handleRoleChange);
    };
  }, []);

  const handleLogout = () => {
    // Xóa toàn bộ thông tin user trong localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("fullName");
    localStorage.removeItem("avatar");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

    // Redirect về trang login
    navigate("/login");

    // Refresh lại trang để đảm bảo state được reset
    window.location.reload();
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-black/85 backdrop-blur-md shadow-lg"
            : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-[#FF009F] font-bold text-3xl tracking-wider"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]">
                  EIGAKAN
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === link.path
                      ? "text-white bg-[#FF009F]/20 border-b-2 border-[#FF009F]"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin/persons"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === "/admin/persons"
                      ? "text-white bg-[#FF009F]/20 border-b-2 border-[#FF009F]"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Person Management
                </Link>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                onClick={toggleSearch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-[#FF009F]/10"
              >
                <Search className="w-4 h-4 text-[#FF009F]" />
                <span className="text-sm hidden sm:inline">Search</span>
              </button>

              {/* User Menu or Login Button */}
              {token && user ? (
                <>
                  <ProfileMenu
                    user={user}
                    showProfileMenu={showProfileMenu}
                    handleLogout={handleLogout}
                    handleProfileClick={(e) => {
                      e.stopPropagation();
                      setShowProfileMenu(!showProfileMenu);
                    }}
                  />
                  {(role === "MEMBER" || user.roleName === "MEMBER") && (
                    <Link
                      to="/subscription-plans"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white transition-all
                      duration-300 ease-in-out shadow-md hover:shadow-[0_0_15px_rgba(255,0,159,0.5)]
                      transform hover:translate-y-[-2px]"
                    >
                      <CrownOutlined />
                      <span>Upgrade Plan</span>
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] hover:from-[#FF009F]/90 hover:to-[#FF6B9F]/90 
                  text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 
                  shadow-md hover:shadow-[0_0_15px_rgba(255,0,159,0.3)] transform hover:translate-y-[-2px]"
                >
                  Login
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMenu}
                className="md:hidden p-2 text-white hover:text-[#FF009F] transition-colors bg-white/5 rounded-lg"
              >
                {isOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md pt-16 md:hidden"
          >
            <div className="container mx-auto px-4 py-8">
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      location.pathname === link.path
                        ? "bg-[#FF009F]/20 text-white border-l-4 border-[#FF009F]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.icon}
                    <span className="text-lg font-medium">{link.label}</span>
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    to="/admin/persons"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      location.pathname === "/admin/persons"
                        ? "bg-[#FF009F]/20 text-white border-l-4 border-[#FF009F]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-lg font-medium">
                      Person Management
                    </span>
                  </Link>
                )}
              </nav>

              <div className="mt-8 border-t border-white/10 pt-6">
                <button
                  onClick={() => {
                    toggleSearch();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Search className="w-5 h-5 text-[#FF009F]" />
                  <span className="text-lg font-medium">Search</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      {showSearch && <SearchBar onClose={toggleSearch} />}
    </>
  );
};

export default Navbar;
