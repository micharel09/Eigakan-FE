import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  LayoutDashboard,
  Heart,
  Tv,
  Search,
  ShoppingCart,
} from "lucide-react";
import { CrownOutlined, HistoryOutlined } from "@ant-design/icons";

// Animation variants for dropdown menu - updated for smooth animations
const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transformOrigin: "top right",
    transitionEnd: {
      display: "none",
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    display: "block",
    transition: {
      duration: 0.15,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transition: {
      duration: 0.1,
      ease: [0.4, 0.0, 1, 1],
    },
  },
};

/**
 * ProfileMenu Component
 *
 * Displays user profile menu with dropdown functionality
 *
 * @param {Object} user - User data object
 * @param {boolean} showProfileMenu - Whether the profile menu is visible
 * @param {Function} handleLogout - Function to handle logout action
 * @param {Function} handleProfileClick - Function to handle profile button click
 */
function ProfileMenu({
  user,
  showProfileMenu,
  handleLogout,
  handleProfileClick,
}) {
  const menuRef = useRef(null);

  // Get user role and determine role-specific flags
  const role = user?.roleName || localStorage.getItem("role");
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isPublisher = role === "PUBLISHER";
  const isAdvertiser = role === "ADVERTISER";
  const isVipMember = role === "VIP MEMBER";

  // Handle clicks outside the menu to close it
  useEffect(() => {
    if (!showProfileMenu) return;

    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        handleProfileClick({ stopPropagation: () => {} });
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [showProfileMenu, handleProfileClick]);

  // Determine dashboard path based on user role
  const getDashboardPath = () => {
    if (isAdmin) return "/dashboard";
    if (isManager) return "/manager/dashboard";
    if (isPublisher) return "/publisher/dashboard";
    if (isAdvertiser) return "/advertiser/dashboard";
    return "";
  };

  // Flag to determine if dashboard button should be shown
  const shouldShowDashboardButton =
    isAdmin || isManager || isPublisher || isAdvertiser;

  // Menu items configuration
  const menuItems = [
    {
      to: "/profile",
      icon: <User />,
      label: "Profile Settings",
    },
    {
      to: "/subscription-history",
      icon: <HistoryOutlined />,
      label: "Subscription History",
    },
    ...(isAdvertiser
      ? [
          {
            to: "/advertiser/buy-adslot",
            icon: <ShoppingCart />,
            label: "Buy AdSlot",
          },
        ]
      : []),
  ];

  // Function to close menu and perform action
  const handleMenuItemClick = () => {
    if (handleProfileClick) {
      handleProfileClick({ stopPropagation: () => {} });
    }
  };

  return (
    <div className="relative profile-menu-container" ref={menuRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={handleProfileClick}
        className="relative flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity"
        aria-expanded={showProfileMenu}
        aria-haspopup="true"
        aria-label="User profile menu"
      >
        {/* Avatar Container with VIP Effects */}
        <div className={`relative ${isVipMember ? "animate-pulse" : ""}`}>
          {/* VIP Crown Icon */}
          {isVipMember && (
            <div className="absolute -top-2 -right-1 sm:-top-3 sm:-right-2 z-10">
              <CrownOutlined className="text-yellow-400 text-base sm:text-lg" />
            </div>
          )}

          {/* Avatar with Glow Effect for VIP */}
          <div
            className={`relative rounded-full ${
              isVipMember
                ? "ring-1 sm:ring-2 ring-[#FF009F] ring-offset-1 sm:ring-offset-2 ring-offset-gray-800"
                : ""
            }`}
          >
            <img
              src={user?.picture || "/avatar2.jpg"}
              alt={user?.fullName || "User Profile"}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ${
                isVipMember
                  ? "border-2 border-[#FF009F]"
                  : "border border-gray-600"
              }`}
            />

            {/* VIP Glow Effect */}
            {isVipMember && (
              <div
                className="absolute inset-0 rounded-full bg-[#FF009F]/20 
                animate-pulse pointer-events-none"
              />
            )}
          </div>
        </div>

        {/* User Name and VIP Badge */}
        <span className="text-white text-xs sm:text-sm hidden sm:inline-flex items-center">
          {user?.fullName}
          {isVipMember && (
            <span
              className="ml-2 inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium
              bg-gradient-to-r from-[#FF009F] to-[#FF4D4D] 
              shadow-lg shadow-[#FF009F]/30
              border border-[#FF009F]/20
              animate-gradient-x"
            >
              <CrownOutlined className="mr-1 text-yellow-300" />
              VIP
            </span>
          )}
        </span>
      </button>

      {/* Dropdown Menu - Pre-rendered with initial visibility hidden */}
      <div
        className={`absolute right-0 mt-2 sm:mt-3 w-52 sm:w-60 perspective-1000 z-50 ${
          !showProfileMenu ? "pointer-events-none" : ""
        }`}
        aria-hidden={!showProfileMenu}
      >
        <AnimatePresence>
          {showProfileMenu && (
            <motion.div
              className="profile-menu-dropdown w-full"
              onClick={(e) => e.stopPropagation()}
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
            >
              <div className="relative">
                {/* Menu Triangle Pointer */}
                <div
                  className="absolute -top-1 right-4 sm:right-7 w-3 h-3 
                  bg-gradient-to-br from-[#1A1A2E] to-[#16162a]
                  backdrop-blur-lg rotate-45 transform origin-center 
                  border-t border-l border-[#FF009F]/20"
                />

                {/* Menu Container */}
                <div
                  className="relative rounded-xl overflow-hidden will-change-transform"
                  style={{
                    WebkitBackdropFilter: "blur(10px)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {/* Blurred gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E]/95 to-[#16162a]/95 pointer-events-none"></div>

                  {/* Subtle border glow */}
                  <div className="absolute inset-0 rounded-xl border border-[#FF009F]/20 shadow-[0_0_20px_rgba(255,0,159,0.15)] pointer-events-none"></div>

                  {/* User Info Header with gradient */}
                  <div className="relative px-4 py-3 border-b border-[#FF009F]/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF009F]/5 to-transparent pointer-events-none"></div>
                    <div className="relative">
                      <p className="text-sm font-medium text-white/90">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-white/60 mt-0.5 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="relative py-1.5">
                    {/* Dashboard Link (if applicable to user role) */}
                    {shouldShowDashboardButton && (
                      <Link
                        to={getDashboardPath()}
                        className="flex items-center px-4 py-2.5 text-sm text-white/80 
                          hover:bg-[#FF009F]/10 hover:text-white transition-all duration-200 group relative"
                        onClick={handleMenuItemClick}
                        role="menuitem"
                      >
                        <span className="absolute inset-y-0 left-0 w-0.5 bg-[#FF009F]/0 group-hover:bg-[#FF009F] transition-all duration-200"></span>
                        <LayoutDashboard className="w-4 h-4 mr-3 text-[#FF009F]/70 group-hover:text-[#FF009F] transition-colors" />
                        <span>Dashboard</span>
                      </Link>
                    )}

                    {/* Menu Items from configuration */}
                    {menuItems.map((item, index) => (
                      <Link
                        key={`${item.to}-${item.label}`}
                        to={item.to}
                        className="flex items-center px-4 py-2.5 text-sm text-white/80 
                          hover:bg-[#FF009F]/10 hover:text-white transition-all duration-200 group relative"
                        onClick={handleMenuItemClick}
                        role="menuitem"
                      >
                        <span className="absolute inset-y-0 left-0 w-0.5 bg-[#FF009F]/0 group-hover:bg-[#FF009F] transition-all duration-200"></span>
                        {React.cloneElement(item.icon, {
                          className:
                            "w-4 h-4 mr-3 text-[#FF009F]/70 group-hover:text-[#FF009F] transition-colors",
                        })}
                        <span>{item.label}</span>
                      </Link>
                    ))}

                    {/* Sign Out Button */}
                    <div className="px-3 pt-1.5 pb-1">
                      <div className="border-t border-[#FF009F]/10 mb-1"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuItemClick();
                          handleLogout(e);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 mt-1 text-sm text-white/80
                          hover:bg-[#FF009F]/10 rounded-lg transition-all duration-200 group"
                        role="menuitem"
                      >
                        <div className="flex items-center">
                          <LogOut className="w-4 h-4 mr-3 text-[#FF009F]/70 group-hover:text-[#FF009F] transition-colors" />
                          <span>Sign Out</span>
                        </div>
                        <span className="text-xs opacity-0 group-hover:opacity-60 transition-opacity">
                          ⌘Q
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ProfileMenu;
