import HomeScreen from "../pages/home/HomeScreen";
import Dashboard from "../pages/Admin/Dashboard/Dashboard.jsx";
import LoginPage from "../pages/Auth/LoginPage";
import SignupPage from "../pages/Auth/SignUpPage";
import HomePage from "../pages/home/HomePage";

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
    layout: "AdvertiserLayout",
    private: true,
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/homepage", element: <HomePage />, layout: "UserLayout" },
  { path: "/homescreen", element: <HomeScreen />, layout: "UserLayout" },
  { path: "*", element: <h1>404 - Page Not Found</h1> },
];

export default routes;
