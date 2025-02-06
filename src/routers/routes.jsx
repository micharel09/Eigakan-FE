import HomeScreen from "../pages/home/HomeScreen";
import Dashboard from "../pages/Admin/Dashboard/Dashboard.jsx";
import LoginPage from "../pages/Auth/LoginPage";
import SignupPage from "../pages/Auth/SignUpPage";
import HomePage from "../pages/home/HomePage";
import WatchPage from "../pages/Watchpage/WatchPage.jsx";
import SearchPage from "../pages/home/Search.jsx";
import MoviePage from "../pages/MoviePage/MoviePage.jsx";
import PrivateRoute from "./PrivateRoute";
import User from "../pages/Admin/User/User.jsx";
import PopularPeople from "../pages/Actor/PopularPeople.jsx";
import PersonDetail from "../pages/Actor/PersonDetail";
import VerifyAccount from "../pages/Auth/VerifyAccount";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import SignupSuccess from "../pages/Auth/SignupSuccess";
import { Navigate } from "react-router-dom";
import ManagerDashboard from "../pages/Manager/Dashboard/Dashboard.jsx";
import Subscription from "../pages/Manager/Subscription/Subscription.jsx";
import NewsManagement from "../pages/Manager/News/NewsManagement.jsx";
import NewsPage from "../pages/News/NewsPage.jsx";

// Hàm kiểm tra người dùng đã đăng nhập hay chưa
const isLoggedIn = () => {
  const loggedIn = localStorage.getItem("user");
  return loggedIn;
};

// Lấy giá trị role từ localStorage
const role = localStorage.getItem("role") || "GUEST";

const routes = [
  {
    path: "/",
    element: <Navigate to="/homescreen" replace />,
  },
  {
    path: "/homescreen",
    element: <HomeScreen />,
  },
  //chỉnh url mặc định theo role
  {
    path: "/",
    element:
      role === "ADMIN" ? (
        <Dashboard />
      ) : role === "MEMBER" ? (
        isLoggedIn() ? (
          <HomeScreen />
        ) : (
          <HomeScreen />
        )
      ) : (
        <HomeScreen />
      ),
    layout:
      role === "ADMIN"
        ? "AdminLayout"
        : role === "MEMBER"
        ? "UserLayout"
        : "GuestLayout",
  },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <Dashboard />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
    private: true,
  },

  { path: "/login", element: <LoginPage /> },

  {
    path: "/movie/:movieId",
    element: <MoviePage />,
    layout: "UserLayout",
  },

  { path: "/watch/:movieId", element: <WatchPage />, layout: "UserLayout" },

  {
    path: "/search",
    element: <SearchPage />,
    layout: "UserLayout",
  },
  {
    path: "/people",
    element: <PopularPeople />,
    layout: "UserLayout",
  },
  {
    path: "/person/:id",
    element: <PersonDetail />,
    layout: "UserLayout",
  },

  { path: "/signup", element: <SignupPage /> },
  { path: "/homepage", element: <HomePage />, layout: "UserLayout" },
  { path: "/user", element: <User />, layout: "AdminLayout" },

  { path: "/verify", element: <VerifyAccount /> },

  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/resetpassword", element: <ResetPassword /> },

  { path: "/signup-success", element: <SignupSuccess /> },

  {
    path: "/manager/dashboard",
    element: (
      <PrivateRoute requiredRole="MANAGER">
        <ManagerDashboard />
      </PrivateRoute>
    ),
    layout: "ManagerLayout",
    private: true,
  },

  {
    path: "/manager/subscription",
    element: (
      <PrivateRoute requiredRole="MANAGER">
        <Subscription />
      </PrivateRoute>
    ),
    layout: "ManagerLayout",
    private: true,
  },

  {
    path: "/manager/news",
    element: (
      <PrivateRoute requiredRole="MANAGER">
        <NewsManagement />
      </PrivateRoute>
    ),
    layout: "ManagerLayout",
    private: true,
  },

  {
    path: "/news",
    element: <NewsPage />,
    layout: "UserLayout",
  },

  { path: "*", element: <h1>404 - Page Not Found</h1> },
];

export default routes;
