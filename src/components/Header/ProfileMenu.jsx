import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Clock,
  LogOut,
  LayoutDashboard,
  Heart,
  Tv,
  Search,
} from "lucide-react";
import {
  CrownOutlined,
  UserOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transformOrigin: "top right",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      duration: 0.3,
      stiffness: 200,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: { duration: 0.2 },
  },
};

function ProfileMenu({
  user,
  showProfileMenu,
  handleLogout,
  handleProfileClick,
}) {
  const role = user?.roleName || localStorage.getItem("role");
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isPublisher = role === "PUBLISHER";
  const isAdvertiser = role === "ADVERTISER";
  const isVipMember = role === "VIP MEMBER";

  // Xác định đường dẫn dashboard dựa trên vai trò
  const getDashboardPath = () => {
    if (isAdmin) return "/dashboard";
    if (isManager) return "/manager/dashboard";
    if (isPublisher) return "/publisher/dashboard";
    if (isAdvertiser) return "/advertiser/dashboard";
    return "";
  };

  // Kiểm tra xem có phải là vai trò cần hiển thị nút Dashboard không
  const shouldShowDashboardButton =
    isAdmin || isManager || isPublisher || isAdvertiser;

  const menuItems = [
    {
      to: "/profile",
      icon: (
        <User className="w-5 h-5 mr-3 text-white/60 group-hover:text-white transition-colors" />
      ),
      label: "Profile Settings",
    },
    {
      to: "/favorites",
      icon: (
        <Heart className="w-5 h-5 mr-3 text-white/60 group-hover:text-white transition-colors" />
      ),
      label: "Favorites",
    },
    {
      to: "/",
      icon: (
        <Tv className="w-5 h-5 mr-3 text-white/60 group-hover:text-white transition-colors" />
      ),
      label: "TV Shows",
    },
    {
      to: "/history",
      icon: (
        <Search className="w-5 h-5 mr-3 text-white/60 group-hover:text-white transition-colors" />
      ),
      label: "Search History",
    },
    {
      to: "/subscription-history",
      icon: (
        <HistoryOutlined className="w-5 h-5 mr-3 text-white/60 group-hover:text-white transition-colors" />
      ),
      label: "Subscription History",
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={handleProfileClick}
        className="relative flex items-center gap-2 focus:outline-none"
      >
        {/* VIP Member Avatar Container */}
        <div className={`relative ${isVipMember ? "animate-pulse" : ""}`}>
          {/* VIP Crown Icon */}
          {isVipMember && (
            <div className="absolute -top-3 -right-2 z-10">
              <CrownOutlined className="text-yellow-400 text-lg" />
            </div>
          )}

          {/* Avatar with Glow Effect for VIP */}
          <div
            className={`relative rounded-full ${
              isVipMember
                ? "ring-2 ring-[#FF009F] ring-offset-2 ring-offset-gray-800"
                : ""
            }`}
          >
            <img
              src={user.picture || "/avatar2.jpg"}
              alt="Profile"
              className={`w-10 h-10 rounded-full object-cover ${
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

        <span className="text-white text-sm hidden sm:block flex items-center">
          {user.fullName}
          {isVipMember && (
            <span
              className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              bg-gradient-to-r from-[#FF009F] to-[#FF4D4D] 
              shadow-lg shadow-[#FF009F]/30
              border border-[#FF009F]/20
              animate-gradient-x"
            >
              <CrownOutlined className="mr-1 text-yellow-300" />
              VIP MEMBER
            </span>
          )}
        </span>
      </button>

      <AnimatePresence>
        {showProfileMenu && (
          <motion.div
            className="absolute right-0 mt-3 w-56 perspective-1000"
            onClick={(e) => e.stopPropagation()}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="relative">
              <div
                className="absolute -top-1 right-7 w-3 h-3 bg-black/40 
                backdrop-blur-lg rotate-45 transform origin-center 
                border-t border-l border-white/10"
              />

              <div
                className="relative bg-black/40 backdrop-blur-md rounded-xl 
                shadow-2xl border border-white/10 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white/90">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-white/60 mt-0.5">{user.email}</p>
                </div>

                <div className="py-2">
                  {shouldShowDashboardButton && (
                    <Link
                      to={getDashboardPath()}
                      className="flex items-center px-4 py-2.5 text-sm text-white/80 
                        hover:bg-white/10 hover:text-white transition-all duration-200 group"
                    >
                      <LayoutDashboard
                        className="w-5 h-5 mr-3 text-white/60 group-hover:text-white 
                          transition-colors"
                      />
                      Dashboard
                    </Link>
                  )}
                  {menuItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center px-4 py-2.5 text-sm text-white/80 
                        hover:bg-white/10 hover:text-white transition-all duration-200 group"
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}

                  <div className="border-t border-white/10 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-white/80 
                      hover:bg-white/10 hover:text-white transition-all duration-200 group"
                  >
                    <LogOut
                      className="w-5 h-5 mr-3 text-white/60 group-hover:text-white 
                      transition-colors"
                    />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfileMenu;
