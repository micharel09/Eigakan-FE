import { LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  VideoCameraOutlined,
  SignatureOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const PublisherSidebar = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
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

  return (
    <div className="min-h-screen flex flex-row bg-gray-100">
      <div className="flex flex-col w-56 bg-white rounded-r-3xl overflow-hidden">
        <div className="relative flex items-center justify-center h-20 shadow-md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="eigakan-gradient text-[#FF009F] font-bold text-2xl"
          >
            EIGAKAN
          </motion.div>

          <h2 className="absolute bottom-1 right-2 text-gray-500 text-xs">
            Publisher
          </h2>
        </div>

        {/* avatar + name  */}
        <ul className="flex flex-col py-4">
          <li className="flex justify-center items-center">
            <div className="flex flex-col items-center gap-2">
              <img
                src={user.picture || "/Linkvatar2.jpg"}
                alt="Avatar"
                className="h-16 w-16 rounded-full cursor-pointer border-2 border-gray-300"
              />
              <span className="text-red-800 text-sm sm:text-base font-medium mt-2">
                {user.fullName}
              </span>
            </div>
          </li>
          <li>
            <Link
              to="/publisher/dashboard"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
              </span>
              <span className="ml-3 text-sm font-medium">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/publisher/userearning"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <DollarOutlined />
              </span>
              <span className="ml-3 text-sm font-medium">Your Earnings</span>
            </Link>
          </li>
          <li>
            <Link
              to="/publisher/movie"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <VideoCameraOutlined />
              </span>
              <span className="ml-3 text-sm font-medium">Your movie</span>
            </Link>
          </li>
          <li>
            <Link
              to="/publisher/contract"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <SignatureOutlined />
              </span>
              <span className="ml-3 text-sm font-medium">Your Contract</span>
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  />
                </svg>
              </span>
              <span className="ml-3 text-sm font-medium" onClick={handleLogout}>
                Logout
              </span>
            </Link>
          </li>
          <li className="mt-auto">
            <Link
              to="/homescreen"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-red-500"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                  />
                </svg>
              </span>
              <span className="ml-3 text-sm font-medium">
                Back to User Site
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PublisherSidebar;
