import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";

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

const ProfileMenu = ({
  user,
  showProfileMenu,
  handleLogout,
  handleProfileClick,
}) => {
  const menuItems = [
    { to: "/profile", icon: "fas fa-user", label: "Profile Settings" },
    {
      to: "/watchlist",
      icon: "fas fa-list",
      label: "My Watchlist",
      badge: "New",
    },
    { to: "/settings", icon: "fas fa-cog", label: "Settings" },
  ];

  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={handleProfileClick}
      >
        <div className="relative transform transition-transform duration-200 hover:scale-105">
          <img
            src={user.picture || "/avatar2.jpg"}
            alt="Avatar"
            className="h-10 w-10 rounded-full object-cover border-2 border-transparent
              hover:border-red-500 transition-all duration-300 shadow-lg"
          />
          <div
            className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 
            rounded-full border-2 border-black shadow-md"
          />
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-semibold leading-tight">{user.fullName}</p>
          <p className="text-xs text-gray-400">Online</p>
        </div>
      </div>

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
                  {menuItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center px-4 py-2.5 text-sm text-white/80 
                        hover:bg-white/10 hover:text-white transition-all duration-200 group"
                    >
                      <i
                        className={`${item.icon} text-white/60 group-hover:text-white 
                        transition-colors w-5 h-5 mr-3`}
                      />
                      {item.label}
                      {item.badge && (
                        <span
                          className="ml-auto bg-red-500/20 text-red-400 px-2 py-0.5 
                          rounded-full text-xs font-medium"
                        >
                          {item.badge}
                        </span>
                      )}
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
};

export default ProfileMenu;
