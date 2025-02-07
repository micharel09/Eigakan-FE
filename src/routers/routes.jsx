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
import Profile from "../pages/Profile/Profile.jsx";
import UserRegister from "../pages/Admin/UserRegister/UserRegister.jsx";
import UserRegisterDetail from "../pages/Admin/UserRegister/UserRegisterDetail.jsx";
import UserRegisterEmail from "../pages/Admin/UserRegister/UserRegisterEmail.jsx";


const isLoggedIn = () => {
  const loggedIn = localStorage.getItem("user");
  return loggedIn;
};

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
  
  //ADMIN 
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


  {
    path: "/userRegister",
    element: (
      <PrivateRoute requiredRole="ADMIN"><UserRegister/></PrivateRoute>
    ),
    layout: "AdminLayout",
  },
  
  {
    path: "/userRegister/:id",
    element: (
      <PrivateRoute requiredRole="ADMIN"><UserRegisterDetail/></PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/userRegister/email/:email",
    element: (
      <PrivateRoute requiredRole="ADMIN"><UserRegisterEmail/></PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  { path: "/user", element: <User />, layout: "AdminLayout" },
  
  
  //USER
  { path: "/movie/:movieId", element: <MoviePage />, layout: "UserLayout",},
  
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

  
  { path: "/search", element: <SearchPage />, layout: "UserLayout"},
  
  { path: "/people", element: <PopularPeople />, layout: "UserLayout", },
  
  { path: "/person/:id", element: <PersonDetail />, layout: "UserLayout",},
  
  { path: "/profile", element: <Profile />, layout: "UserLayout", },
  
  { path: "/profile/:id",  element: <Profile />, layout: "UserLayout",},
  
  

  
  { path: "/signup", element: <SignupPage /> },
  { path: "/homepage", element: <HomePage />, layout: "UserLayout" },
  { path: "/user", element: <User />, layout: "AdminLayout" },

  { path: "/verify", element: <VerifyAccount /> },

  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/resetpassword", element: <ResetPassword /> },

  { path: "/signup-success", element: <SignupSuccess /> },

  { path: "/homescreen", element: <HomeScreen />, layout: "UserLayout" },
  { path: "/login", element: <LoginPage /> },
  { path: "*", element: <h1>404 - Page Not Found</h1> },
];

export default routes;
