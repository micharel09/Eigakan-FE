import { createBrowserRouter, Navigate } from "react-router-dom";
import Dashboard from "../pages/Admin/Dashboard/Dashboard.jsx";
import LoginPage from "../pages/Auth/LoginPage.jsx";
import SignupPage from "../pages/Auth/SignUpPage.jsx";
import HomeScreen from "../pages/home/HomeScreen.jsx";
import HomePage from "../pages/home/HomePage.jsx";
import WatchPage from "../pages/Watchpage/WatchPage.jsx";
import MoviePage from "../pages/MoviePage/MoviePage.jsx";

// Kiểm tra xem người dùng đã đăng nhập chưa
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  // Nếu người dùng chưa đăng nhập, sẽ chuyển hướng về trang login
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const DefaultRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  // Nếu người dùng chưa đăng nhập, sẽ chuyển hướng về trang login
  return isAuthenticated ? children : <Navigate to="/homepage" replace />;
};

const createRouter = () =>
  createBrowserRouter([
    {
      path: "/",
      element: (
        <DefaultRoute>
          <HomePage />
        </DefaultRoute>
      ),
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/signup",
      element: <SignupPage />,
    },
    {
      path: "*",
      element: <h1>404 - Page Not Found</h1>,
    },

    {
      path: "/movie/:movieId",
      element: <MoviePage />,
    },
    {
      path: "/watch/:movieId",
      element: <WatchPage />,
    },
    {
      path: "/search",
      element: <SearchPage />,
    },
    {
      path: "/homepage",
      element: <HomePage />,
    },
    {
      path: "/homescreen",
      element: <HomeScreen />,
    },
    {
      path: "/dashboard",
      element: (
        <PrivateRoute>
          {" "}
          {/* Bảo vệ route dashboard */}
          <Dashboard />
        </PrivateRoute>
      ),
    },
  ]);

export default createRouter;
