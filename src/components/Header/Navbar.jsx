import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { CrownOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Input, notification } from "antd";
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
  LayoutDashboard,
  UsersRound,
  Sparkles,
  BrainCircuit,
  ChevronDown,
} from "lucide-react";

import authService from "../../apis/Auth/auth";
import roomService from "../../apis/Room/room";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";
import RecommendedMovies from "../Homepage/RecommendedMovies";

const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  PUBLISHER: "PUBLISHER",
  ADVERTISER: "ADVERTISER",
  MEMBER: "MEMBER",
  VIP_MEMBER: "VIP MEMBER",
};

const NAV_LINKS = [
  { path: "/homescreen", label: "Movies", icon: <Film className="h-4 w-4" /> },
  {
    path: "/genres",
    label: "Genres",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    path: "/people",
    label: "Popular People",
    icon: <Users className="h-4 w-4" />,
  },
  { path: "/news", label: "News", icon: <Newspaper className="h-4 w-4" /> },
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
  const [isJoinRoomModalVisible, setIsJoinRoomModalVisible] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [hostedRooms, setHostedRooms] = useState([]);
  const [showRecommendationsModal, setShowRecommendationsModal] =
    useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.roleName || localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const isUserRole = (roleType) => role === roleType;
  const isInPath = (path) => location.pathname.includes(path);

  const isAdmin = isUserRole(ROLES.ADMIN);
  const isManager = isUserRole(ROLES.MANAGER);
  const isPublisher = isUserRole(ROLES.PUBLISHER);
  const isAdvertiser = isUserRole(ROLES.ADVERTISER);
  const isVipMember = isUserRole(ROLES.VIP_MEMBER);
  const isMember = isUserRole(ROLES.MEMBER);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateUser = () => setUser(authService.getCurrentUser());
    authService.addListener(updateUser);
    return () => authService.removeListener(updateUser);
  }, []);

  useEffect(() => {
    const handleRoleChange = () => {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    };
    window.addEventListener("userRoleChanged", handleRoleChange);
    return () =>
      window.removeEventListener("userRoleChanged", handleRoleChange);
  }, []);

  useEffect(() => {
    const fetchHostedRooms = async () => {
      if (!token || !user) return;

      try {
        const response = await roomService.getHostRoom();
        if (!response.success) return;

        const roomData = Array.isArray(response.data)
          ? response.data
          : [response.data].filter(Boolean);

        setHostedRooms(roomData.filter((room) => room?.status === "Active"));
      } catch (error) {
        console.error("Error fetching hosted rooms:", error);
        setHostedRooms([]);
      }
    };

    fetchHostedRooms();
  }, [user, token]);

  const handleLogout = () => {
    const keysToRemove = [
      "user",
      "token",
      "fullName",
      "avatar",
      "role",
      "userId",
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    navigate("/login");
    window.location.reload();
  };

  const handleJoinRoom = async () => {
    if (isJoining || !roomId.trim()) return;
    setIsJoining(true);

    try {
      if (!token) {
        notification.error({
          message: "Authentication Required",
          description: "Please login to join a watch room",
        });
        setIsJoinRoomModalVisible(false);
        navigate("/login");
        return;
      }

      const userId = user?.userId?.replace(/^userid:\s*/i, "");
      if (!userId) {
        notification.error({
          message: "User Data Missing",
          description: "Please try logging in again",
        });
        return;
      }

      const roomDetails = await roomService.getRoomDetails(roomId.trim());
      let movieId = roomDetails.success ? roomDetails.data?.movieID : null;

      if (!movieId) {
        const hostedRoom = hostedRooms.find(
          (room) => room?.id === roomId.trim()
        );
        movieId = hostedRoom?.movieID;
      }

      const joinResponse = await roomService.joinRoom({
        roomId: roomId.trim(),
        userId,
        movieId,
      });

      if (joinResponse.success) {
        notification.success({ message: "Joined room successfully!" });
        setIsJoinRoomModalVisible(false);

        // Extract movieId from response if not already set
        if (!movieId && joinResponse.data) {
          movieId = Array.isArray(joinResponse.data)
            ? joinResponse.data[0]?.movieID
            : joinResponse.data.movieID;
        }

        navigate(
          `/watch-together/${
            movieId || "undefined"
          }?roomId=${roomId.trim()}&movieId=${movieId || ""}`
        );
      } else {
        throw new Error(joinResponse.message || "Could not join room");
      }
    } catch (error) {
      notification.error({
        message: "Failed to join room",
        description: error.message,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getDashboardPath = () => {
    if (isAdmin) return "/dashboard";
    if (isManager) return "/manager/dashboard";
    if (isPublisher) return "/publisher/dashboard";
    if (isAdvertiser) return "/advertiser/dashboard";
    return "";
  };

  const shouldShowDashboardButton =
    isAdmin || isManager || isPublisher || isAdvertiser;

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleSearch = () => setShowSearch(!showSearch);
  const openRecommendationsModal = () => setShowRecommendationsModal(true);
  const closeRecommendationsModal = () => setShowRecommendationsModal(false);

  return (
    <div className="relative m-0 p-0 border-0 shadow-none navbar-clean">
      {/* Background gradient that fades to transparent */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="h-20 w-full">
          <div
            className={`absolute inset-0 bg-gradient-to-b from-black via-black/70 to-transparent transition-opacity duration-300 border-0 outline-none shadow-none ${
              isScrolled ? "opacity-90" : "opacity-85"
            }`}
          ></div>
        </div>
      </div>

      {/* Actual navbar container - transparent background */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-0 shadow-none bg-transparent">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              to="/homepage"
              className="flex items-center group"
              aria-label="Home"
              tabIndex="0"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-[#FF009F] font-bold text-2xl md:text-3xl tracking-wider relative"
                whileHover={{ scale: 1.05 }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] eigakan-gradient relative z-10">
                  EIGAKAN
                </span>
                <div className="absolute inset-0 bg-[#FF009F] blur-[20px] opacity-20 group-hover:opacity-30 transition-opacity duration-300 z-0"></div>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {shouldShowDashboardButton && (
                <Link
                  to={getDashboardPath()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2 relative ${
                    isInPath(getDashboardPath())
                      ? "bg-[#FF009F]/10"
                      : "hover:bg-white/5"
                  }`}
                  aria-label="Dashboard"
                  tabIndex="0"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#FF009F] transition-colors duration-300" />
                  <span className="text-[#FF009F] transition-colors duration-300">
                    Dashboard
                  </span>
                  {isInPath(getDashboardPath()) && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              )}

              {NAV_LINKS.filter(
                (link) => !isInPath("/") || link.path !== "/"
              ).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2 relative ${
                    isInPath(link.path) ? "bg-[#FF009F]/10" : "hover:bg-white/5"
                  }`}
                  aria-label={link.label}
                  tabIndex="0"
                >
                  <div
                    className={`transition-colors duration-300 ${
                      isInPath(link.path)
                        ? "text-[#FF009F]"
                        : "text-gray-400 group-hover:text-[#FF009F]"
                    }`}
                  >
                    {link.icon}
                  </div>
                  <span
                    className={`transition-colors duration-300 ${
                      isInPath(link.path)
                        ? "text-[#FF009F]"
                        : "text-gray-300 group-hover:text-white"
                    }`}
                  >
                    {link.label}
                  </span>
                  {isInPath(link.path) && (
                    <motion.div
                      layoutId={`indicator-${link.path}`}
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  to="/admin/persons"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2 relative ${
                    isInPath("/admin/persons")
                      ? "bg-[#FF009F]/10"
                      : "hover:bg-white/5"
                  }`}
                  aria-label="Person Management"
                  tabIndex="0"
                >
                  <div
                    className={`transition-colors duration-300 ${
                      isInPath("/admin/persons")
                        ? "text-[#FF009F]"
                        : "text-gray-400 group-hover:text-[#FF009F]"
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <span
                    className={`transition-colors duration-300 ${
                      isInPath("/admin/persons")
                        ? "text-[#FF009F]"
                        : "text-gray-300 group-hover:text-white"
                    }`}
                  >
                    Person Management
                  </span>
                  {isInPath("/admin/persons") && (
                    <motion.div
                      layoutId="indicator-admin-persons"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Join Room Button */}
              {token && user && (
                <button
                  onClick={() => setIsJoinRoomModalVisible(true)}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-[#FF009F]/10 hover:bg-[#FF009F]/20 text-white transition-all duration-300 border border-[#FF009F]/30 hover:border-[#FF009F]/50 shadow-lg hover:shadow-[0_0_15px_rgba(255,0,159,0.3)] hover:scale-105 relative overflow-hidden group"
                  aria-label="Join Room"
                  tabIndex="0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF009F]/0 via-[#FF009F]/10 to-[#FF009F]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer"></div>
                  <UsersRound className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FF009F] group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs hidden md:inline relative z-10">
                    Join Room
                  </span>
                </button>
              )}

              {/* AI Recommendations Button - Only for VIP MEMBER, ADMIN or MANAGER*/}
              {(isVipMember || isAdmin || isManager) && (
                <button
                  onClick={openRecommendationsModal}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-[#FF009F]/10 hover:bg-[#FF009F]/20 text-white transition-all duration-300 border border-[#FF009F]/30 hover:border-[#FF009F]/50 shadow-lg hover:shadow-[0_0_15px_rgba(255,0,159,0.3)] hover:scale-105 relative overflow-hidden group"
                  aria-label="AI Recommendations"
                  tabIndex="0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF009F]/0 via-[#FF009F]/10 to-[#FF009F]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer"></div>
                  <BrainCircuit className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FF009F] group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs hidden md:inline relative z-10">
                    AI Picks
                  </span>
                  <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#FF009F]" />
                </button>
              )}

              {/* Search Button */}
              <button
                onClick={toggleSearch}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105 relative overflow-hidden group"
                aria-label="Search"
                tabIndex="0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer"></div>
                <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FF009F] group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs hidden md:inline relative z-10">
                  Search
                </span>
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
                      className="hidden md:flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs font-medium
                      bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white transition-all
                      duration-300 ease-in-out shadow-md hover:shadow-[0_0_15px_rgba(255,0,159,0.5)]
                      hover:-translate-y-0.5 hover:scale-105 relative overflow-hidden group"
                      aria-label="Upgrade Plan"
                      tabIndex="0"
                    >
                      <div className="absolute top-0 left-0 right-0 h-full w-full bg-gradient-to-r from-[#FF009F]/0 via-white/20 to-[#FF009F]/0 transform -skew-x-30 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <CrownOutlined className="text-yellow-300 group-hover:animate-pulse" />
                      <span className="relative z-10">Upgrade Plan</span>
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] hover:from-[#FF009F]/90 hover:to-[#FF6B9F]/90 
                  text-white px-3 py-1.5 md:px-5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 
                  shadow-md hover:shadow-[0_0_20px_rgba(255,0,159,0.4)] hover:-translate-y-0.5 hover:scale-105
                  relative overflow-hidden group"
                  aria-label="Login"
                  tabIndex="0"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF009F]/0 via-white/10 to-[#FF009F]/0 animate-shimmer"></div>
                  </div>
                  <span className="relative z-10">Login</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMenu}
                className="md:hidden p-1.5 text-white hover:text-[#FF009F] transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                aria-label={isOpen ? "Close menu" : "Open menu"}
                tabIndex="0"
              >
                {isOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 pt-16 md:hidden overflow-y-auto bg-black/95 backdrop-blur-md"
            aria-label="Mobile menu"
          >
            <div className="container mx-auto px-4 py-6">
              <nav className="flex flex-col space-y-3">
                {token && user && (
                  <button
                    onClick={() => {
                      setIsJoinRoomModalVisible(true);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#FF009F]/10 hover:bg-[#FF009F]/20 text-white transition-all duration-300 border border-[#FF009F]/30"
                    aria-label="Join Room"
                    tabIndex="0"
                  >
                    <UsersRound className="w-5 h-5 text-[#FF009F]" />
                    <span className="text-base font-medium">Join Room</span>
                  </button>
                )}

                {/* Dashboard Link (if applicable) */}
                {shouldShowDashboardButton && (
                  <Link
                    to={getDashboardPath()}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300 ${
                      isInPath(getDashboardPath())
                        ? "bg-[#FF009F]/10 border-l-4 border-[#FF009F]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                    }`}
                    onClick={() => setIsOpen(false)}
                    aria-label="Dashboard"
                    tabIndex="0"
                  >
                    <span
                      className={`w-5 h-5 flex items-center justify-center transition-colors duration-300 ${
                        isInPath(getDashboardPath()) ? "text-[#FF009F]" : ""
                      }`}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                    </span>
                    <span
                      className={`text-base font-medium transition-colors duration-300 ${
                        isInPath(getDashboardPath()) ? "text-[#FF009F]" : ""
                      }`}
                    >
                      Dashboard
                    </span>
                  </Link>
                )}

                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300 ${
                      isInPath(link.path)
                        ? "bg-[#FF009F]/10 border-l-4 border-[#FF009F]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                    }`}
                    onClick={() => setIsOpen(false)}
                    aria-label={link.label}
                    tabIndex="0"
                  >
                    <span
                      className={`w-5 h-5 flex items-center justify-center transition-colors duration-300 ${
                        isInPath(link.path) ? "text-[#FF009F]" : ""
                      }`}
                    >
                      {link.icon}
                    </span>
                    <span
                      className={`text-base font-medium transition-colors duration-300 ${
                        isInPath(link.path) ? "text-[#FF009F]" : ""
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                ))}

                {isAdmin && (
                  <Link
                    to="/admin/persons"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300 ${
                      isInPath("/admin/persons")
                        ? "bg-[#FF009F]/10 border-l-4 border-[#FF009F]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                    }`}
                    onClick={() => setIsOpen(false)}
                    aria-label="Person Management"
                    tabIndex="0"
                  >
                    <span
                      className={`w-5 h-5 flex items-center justify-center transition-colors duration-300 ${
                        isInPath("/admin/persons") ? "text-[#FF009F]" : ""
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </span>
                    <span
                      className={`text-base font-medium transition-colors duration-300 ${
                        isInPath("/admin/persons") ? "text-[#FF009F]" : ""
                      }`}
                    >
                      Person Management
                    </span>
                  </Link>
                )}

                {/* Add Upgrade Plan button in mobile menu for MEMBER users */}
                {token &&
                  user &&
                  (role === "MEMBER" || user.roleName === "MEMBER") && (
                    <Link
                      to="/subscription-plans"
                      className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white transition-all duration-300 hover:scale-102 shadow-md hover:shadow-[0_0_15px_rgba(255,0,159,0.3)]"
                      onClick={() => setIsOpen(false)}
                      aria-label="Upgrade Plan"
                      tabIndex="0"
                    >
                      <CrownOutlined className="text-yellow-300" />
                      <span className="text-base font-medium">
                        Upgrade Plan
                      </span>
                    </Link>
                  )}
              </nav>

              <div className="mt-6 border-t border-white/10 pt-6">
                {/* AI Picks Button in Mobile Menu - Only for VIP MEMBER, ADMIN or MANAGER */}
                {(isVipMember || isAdmin || isManager) && (
                  <button
                    onClick={() => {
                      openRecommendationsModal();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 w-full p-3 mb-3 rounded-lg bg-[#FF009F]/10 hover:bg-[#FF009F]/20 text-white transition-all duration-300 hover:scale-102 border border-[#FF009F]/30"
                    aria-label="AI Recommendations"
                    tabIndex="0"
                  >
                    <BrainCircuit className="w-5 h-5 text-[#FF009F]" />
                    <span className="text-base font-medium">AI Picks</span>
                    <Sparkles className="w-3 h-3 text-[#FF009F] ml-1" />
                  </button>
                )}

                <button
                  onClick={() => {
                    toggleSearch();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all duration-300 hover:scale-102"
                  aria-label="Search"
                  tabIndex="0"
                >
                  <Search className="w-5 h-5 text-[#FF009F]" />
                  <span className="text-base font-medium">Search</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Room Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-gray-800">
            <UsersRound className="w-5 h-5 text-[#FF009F]" />
            <span className="text-lg font-medium">Join Watch Room</span>
          </div>
        }
        open={isJoinRoomModalVisible}
        onOk={handleJoinRoom}
        onCancel={() => {
          setRoomId("");
          setIsJoinRoomModalVisible(false);
        }}
        okText="Join"
        cancelText="Cancel"
        okButtonProps={{
          loading: isJoining,
          disabled: isJoining || !roomId.trim(),
          className:
            "bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] border-[#FF009F]",
        }}
        cancelButtonProps={{
          disabled: isJoining,
          className: "border-gray-300",
        }}
        width={360}
        centered
        destroyOnClose
        className="watch-room-modal"
      >
        <div className="mt-4">
          {hostedRooms.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2 font-medium">
                Your active rooms:
              </p>
              <div className="max-h-[120px] overflow-y-auto">
                {hostedRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-2 rounded mb-2 border border-gray-200 transition-colors duration-200"
                  >
                    <span className="font-medium text-xs truncate max-w-[180px]">
                      {room.id}
                    </span>
                    <button
                      className="text-[#FF009F] text-xs font-medium hover:text-[#FF6B9F] transition-colors"
                      onClick={() => setRoomId(room.id)}
                      aria-label={`Use room ${room.id}`}
                      tabIndex="0"
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Input
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={isJoining}
            className="cursor-text"
            prefix={<UsersRound className="w-4 h-4 text-gray-400 mr-1" />}
            autoFocus
            onPressEnter={handleJoinRoom}
          />
          <div className="mt-3 text-xs text-gray-500">
            Enter a room ID to join a watch party with friends
          </div>
        </div>
      </Modal>

      {/* AI Recommendations Modal */}
      {showRecommendationsModal && (
        <RecommendedMovies
          showModal={showRecommendationsModal}
          setShowModal={setShowRecommendationsModal}
          isModal={true}
        />
      )}

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearch && <SearchBar onClose={() => setShowSearch(false)} />}
      </AnimatePresence>
    </div>
  );
};

Navbar.propTypes = {
  setShowSearch: PropTypes.func,
  setSidebarOpen: PropTypes.func,
};

export default Navbar;
