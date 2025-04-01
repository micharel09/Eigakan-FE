import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  ChevronDown,
} from "lucide-react";

import authService from "../../apis/Auth/auth";
import roomService from "../../apis/Room/room";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";
import { useAuth, useScrollEffect, usePath } from "../../hooks";

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

// NavLink component extracted and memoized to prevent re-renders
const NavLink = React.memo(({ path, label, icon, isActive }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  return (
    <Link
      to={path}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2 relative ${
        isActive ? "bg-[#FF009F]/10" : "hover:bg-white/5"
      }`}
      aria-label={label}
      tabIndex="0"
      onKeyDown={handleKeyDown}
    >
      <div
        className={`transition-colors duration-300 ${
          isActive
            ? "text-[#FF009F]"
            : "text-gray-400 group-hover:text-[#FF009F]"
        }`}
      >
        {icon}
      </div>
      <span
        className={`transition-colors duration-300 ${
          isActive ? "text-[#FF009F]" : "text-gray-300 group-hover:text-white"
        }`}
      >
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId={`indicator-${path}`}
          className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </Link>
  );
});

NavLink.displayName = "NavLink";

// Action button component extracted and memoized
const ActionButton = React.memo(
  ({ onClick, ariaLabel, icon, label, isSpecial = false }) => {
    const baseClasses = isSpecial
      ? "bg-[#FF009F]/10 hover:bg-[#FF009F]/20 border-[#FF009F]/30 hover:border-[#FF009F]/50 hover:shadow-[0_0_15px_rgba(255,0,159,0.3)]"
      : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]";

    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    };

    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full ${baseClasses} text-white transition-all duration-300 border shadow-lg hover:scale-105 relative overflow-hidden group`}
        aria-label={ariaLabel}
        tabIndex="0"
        onKeyDown={handleKeyDown}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${
            isSpecial
              ? "from-[#FF009F]/0 via-[#FF009F]/10 to-[#FF009F]/0"
              : "from-white/0 via-white/5 to-white/0"
          } opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer`}
        ></div>
        {React.cloneElement(icon, {
          className: `w-3.5 h-3.5 md:w-4 md:h-4 ${
            isSpecial ? "text-[#FF009F]" : "text-[#FF009F]"
          } group-hover:scale-110 transition-transform duration-300`,
        })}
        {label && (
          <span className="text-xs hidden md:inline relative z-10">
            {label}
          </span>
        )}
      </button>
    );
  }
);

ActionButton.displayName = "ActionButton";

const Navbar = () => {
  // Use custom hooks
  const {
    user,
    token,
    handleLogout,
    isAdmin,
    isManager,
    isPublisher,
    isAdvertiser,
    isVipMember,
    isMember,
  } = useAuth();

  const { isScrolled } = useScrollEffect(10);
  const { isInPath } = usePath();

  const navigate = useNavigate();
  const location = useLocation();

  // Local state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isJoinRoomModalVisible, setIsJoinRoomModalVisible] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [hostedRooms, setHostedRooms] = useState([]);

  // Memoized values
  const isMoviePage = useMemo(
    () => location.pathname.includes("/movie/"),
    [location.pathname]
  );
  const role = useMemo(
    () => user?.roleName || localStorage.getItem("role"),
    [user]
  );

  // Memoize dashboard path calculation
  const dashboardPath = useMemo(() => {
    if (isAdmin) return "/dashboard";
    if (isManager) return "/manager/dashboard";
    if (isPublisher) return "/publisher/dashboard";
    if (isAdvertiser) return "/advertiser/dashboard";
    return "";
  }, [isAdmin, isManager, isPublisher, isAdvertiser]);

  const shouldShowDashboardButton = useMemo(
    () => isAdmin || isManager || isPublisher || isAdvertiser,
    [isAdmin, isManager, isPublisher, isAdvertiser]
  );

  // Use callbacks for event handlers
  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);
  const toggleSearch = useCallback(() => setShowSearch((prev) => !prev), []);

  const handleJoinRoom = useCallback(async () => {
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

      if (roomDetails?.status === 403) { 
        notification.error({
          message: "Error",
          description: "You are not VIP MEMBER - Please buy subscription to join room",
        });
        return;
      }
      
      if (roomDetails?.data.success == false) {
        notification.error({
          message: "Error",
          description: roomDetails?.data?.message || "Room details not available.",
        });
        return;
      }
      

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
  }, [isJoining, roomId, token, user, hostedRooms, navigate]);

  // Fetch hosted rooms
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

  // Memoize filtered navigation links
  const filteredNavLinks = useMemo(() => {
    return NAV_LINKS.filter((link) => !isInPath("/") || link.path !== "/");
  }, [isInPath]);

  // Rest of the component remains the same, but using the memoized values
  // and extracted components for better performance

  return (
    <div
      className={`relative ${
        isMoviePage ? "m-0 p-0 border-0 shadow-none navbar-clean" : ""
      }`}
    >
      {/* Background gradient that fades to transparent - only shown on non-movie pages */}
      {!isMoviePage && (
        <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
          <div className="h-20 w-full">
            <div
              className={`absolute inset-0 bg-gradient-to-b from-black via-black/70 to-transparent transition-opacity duration-300 border-0 outline-none shadow-none ${
                isScrolled ? "opacity-90" : "opacity-85"
              }`}
            ></div>
          </div>
        </div>
      )}

      {/* Actual navbar container - transparent background */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isMoviePage ? "border-0 shadow-none bg-transparent" : ""
        }`}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo - Simple with gradient color effect but no hover/transition animations */}
            <Link
              to="/homepage"
              className="flex items-center"
              aria-label="Home"
            >
              <div className="navbar-logo text-[#FF009F] font-bold text-2xl md:text-3xl tracking-wider">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] eigakan-gradient">
                  EIGAKAN
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {shouldShowDashboardButton && (
                <NavLink
                  path={dashboardPath}
                  label="Dashboard"
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  isActive={isInPath(dashboardPath)}
                />
              )}

              {filteredNavLinks.map((link) => (
                <NavLink
                  key={link.path}
                  path={link.path}
                  label={link.label}
                  icon={link.icon}
                  isActive={isInPath(link.path)}
                />
              ))}

              {isAdmin && (
                <NavLink
                  path="/admin/persons"
                  label="Person Management"
                  icon={<User className="w-4 h-4" />}
                  isActive={isInPath("/admin/persons")}
                />
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Toggle Mobile Menu Button - Only visible on mobile */}
              <button
                className="md:hidden text-white hover:text-[#FF009F] transition-colors"
                onClick={toggleMenu}
                aria-label="Toggle Mobile Menu"
              >
                {isOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              {/* Join Room Button */}
              {token && user && (
                <ActionButton
                  onClick={() => setIsJoinRoomModalVisible(true)}
                  ariaLabel="Join Room"
                  icon={<UsersRound />}
                  label="Join Room"
                  isSpecial={true}
                />
              )}

              {/* Search Button */}
              <ActionButton
                onClick={toggleSearch}
                ariaLabel="Search"
                icon={<Search />}
                label="Search"
                isSpecial={false}
              />

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
                  {isMember && (
                    <Link
                      to="/subscription-plans"
                      className="hidden md:flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs font-medium
                      bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white transition-all"
                    >
                      <CrownOutlined className="text-yellow-300" />
                      Upgrade
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-[#FF009F] hover:bg-[#FF0086] text-white transition-all duration-200 text-sm font-medium"
                >
                  Login
                </Link>
              )}
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
                    to={dashboardPath}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300 ${
                      isInPath(dashboardPath)
                        ? "bg-[#FF009F]/10 border-l-4 border-[#FF009F]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                    }`}
                    onClick={() => setIsOpen(false)}
                    aria-label="Dashboard"
                    tabIndex="0"
                  >
                    <span
                      className={`w-5 h-5 flex items-center justify-center transition-colors duration-300 ${
                        isInPath(dashboardPath) ? "text-[#FF009F]" : ""
                      }`}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                    </span>
                    <span
                      className={`text-base font-medium transition-colors duration-300 ${
                        isInPath(dashboardPath) ? "text-[#FF009F]" : ""
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
                {token && user && isMember && (
                  <Link
                    to="/subscription-plans"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white transition-all duration-300 hover:scale-102 shadow-md hover:shadow-[0_0_15px_rgba(255,0,159,0.3)]"
                    onClick={() => setIsOpen(false)}
                    aria-label="Upgrade Plan"
                    tabIndex="0"
                  >
                    <CrownOutlined className="text-yellow-300" />
                    <span className="text-base font-medium">Upgrade Plan</span>
                  </Link>
                )}
              </nav>

              <div className="mt-6 border-t border-white/10 pt-6">
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
