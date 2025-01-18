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

const isLoggedIn = () => Boolean(localStorage.getItem("user"));

const LAYOUTS = {
  USER: "UserLayout",
  ADMIN: "AdminLayout",
};

const routes = [
  {
    path: "/",
    element: isLoggedIn() ? <HomePage /> : <HomeScreen />,
    layout: LAYOUTS.USER,
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },

  {
    path: "/dashboard",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <Dashboard />
      </PrivateRoute>
    ),
    layout: LAYOUTS.ADMIN,
    private: true,
  },
  {
    path: "/user",
    element: <User />,
    layout: LAYOUTS.ADMIN,
  },

  {
    path: "/movie/:movieId",
    element: <MoviePage />,
    layout: LAYOUTS.USER,
  },
  {
    path: "/watch/:movieId",
    element: <WatchPage />,
    layout: LAYOUTS.USER,
  },
  {
    path: "/search",
    element: <SearchPage />,
    layout: LAYOUTS.USER,
  },

  {
    path: "/people",
    element: <PopularPeople />,
    layout: LAYOUTS.USER,
  },
  {
    path: "/person/:id",
    element: <PersonDetail />,
    layout: LAYOUTS.USER,
  },

  {
    path: "/homepage",
    element: <HomePage />,
    layout: LAYOUTS.USER,
  },
  {
    path: "/homescreen",
    element: <HomeScreen />,
    layout: LAYOUTS.USER,
  },

  { path: "*", element: <h1>404 - Page Not Found</h1> },
];

export default routes;
