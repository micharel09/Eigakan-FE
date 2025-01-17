import HomeScreen from "../pages/home/HomeScreen";
import Dashboard from "../pages/Admin/Dashboard/Dashboard.jsx";
import LoginPage from "../pages/Auth/LoginPage";
import SignupPage from "../pages/Auth/SignUpPage";
import HomePage from "../pages/home/HomePage";
import WatchPage from "../pages/Watchpage/WatchPage.jsx";
import SearchPage from "../pages/home/Search.jsx";
import MoviePage from "../pages/MoviePage/MoviePage.jsx";
import User from "../pages/Admin/User/User.jsx";

const isLoggedIn = () => {
  const loggedIn = localStorage.getItem("user") !== null;
  console.log("isLoggedIn:", loggedIn); // Debugging log
  return loggedIn;
};

const routes = [
  {
    path: "/",
    element: isLoggedIn() ? <HomePage /> : <HomeScreen />,
    layout: "UserLayout",
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
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

  { path: "/signup", element: <SignupPage /> },
  { path: "/homepage", element: <HomePage />, layout: "UserLayout" },
  { path: "/homescreen", element: <HomeScreen />, layout: "UserLayout" },
  { path: "/user", element: <User />, layout: "AdminLayout" },
  { path: "*", element: <h1>404 - Page Not Found</h1> },
];

export default routes;
