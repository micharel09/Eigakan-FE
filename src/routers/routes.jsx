import HomeScreen from "../pages/home/HomeScreen";
import Dashboard from "../pages/Admin/Dashboard/Dashboard.jsx";
import LoginPage from "../pages/Auth/LoginPage";
import SignupPage from "../pages/Auth/SignUpPage";
import HomePage from "../pages/home/HomePage";
import WatchPage from "../pages/Watchpage/WatchPage";
import SearchPage from "../pages/home/Search.jsx";
import MoviePage from "../pages/MoviePage/MoviePage";
import PrivateRoute from "./PrivateRoute";
import User from "../pages/Admin/User/User.jsx";
import PopularPeople from "../pages/Actor/PopularPeople.jsx";
import PersonDetail from "../pages/Actor/PersonDetail";
import Profile from "../pages/Profile/Profile.jsx";
import UserRegister from "../pages/Admin/UserRegister/UserRegister.jsx";
import UserRegisterDetail from "../pages/Admin/UserRegister/UserRegisterDetail.jsx";
import UserRegisterEmail from "../pages/Admin/UserRegister/UserRegisterEmail.jsx";
import SignupSuccess from "../pages/Auth/SignupSuccess";
import VerifyAccount from "../pages/Auth/VerifyAccount";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import ManagerDashboard from "../pages/Manager/Dashboard/Dashboard.jsx";
import NewsManagement from "../pages/Manager/News/NewsManagement.jsx";
import NewsPage from "../pages/News/NewsPage.jsx";
import NewsDetail from "../pages/News/NewsDetail";
import GenreManagement from "../pages/Admin/Genre/GenreManagement.jsx";
import PersonManagement from "../pages/Admin/Person/PersonManagement";
import SubscriptionManagement from "../pages/Admin/Subscription/SubscriptionManagement";
import SubscriptionPlans from "../pages/Subscription/SubscriptionPlans";
import PaymentSuccess from "../pages/Payment/PaymentSuccess";
import RegisterPage from "../pages/Auth/RegisterPage.jsx";
import SubscriptionHistory from "../pages/Subscription/SubscriptionHistory";
import SubscriptionOrderManagement from "../pages/Admin/Subscription/SubscriptionOrderManagement";
import UserDetail from "../pages/Admin/User/UserDetail.jsx";
import MoviePublisher from "../pages/Publisher/Movie/MoviePublisher.jsx";
import DashboardPublisher from "../pages/Publisher/Dashboard/DashboardPublisher.jsx";
import MovieAdmin from "../pages/Admin/Movie/MovieAdmin.jsx";
import CreateMovie from "../pages/Admin/Movie/CreateMovie.jsx";
import MovieDetailAdmin from "../pages/Admin/Movie/MovieDetailAdmin.jsx";
import Subscription from "../pages/Manager/Subscription/SubscriptionManagement.jsx";
import CreateMoviePublisher from "../pages/Publisher/Movie/CreateMoviePublisher.jsx";
import MovieDetailPublisher from "../pages/Publisher/Movie/MovieDetailPublisher.jsx";
import ContractAdmin from "../pages/Admin/Contract/ContractAdmin.jsx";
import ContractDetailAdmin from "../pages/Admin/Contract/ContractDetailAdmin.jsx";
import ContractPublisher from "../pages/Publisher/Contract/ContractPublisher.jsx";
import ContractDetailPublisher from "../pages/Publisher/Contract/ContractDetailPublisher.jsx";
import ProcessStatus from "../components/WorkFlow/MovieWorkflow.jsx";
import UploadFormPublisher from "../pages/Publisher/Movie/UploadFormPublisher.jsx";
import UpdateMoviePublisher from "../pages/Publisher/Movie/UpdateMoviePublisher.jsx";
import UpdateMovieAdmin from "../pages/Admin/Movie/UpdateMovieAdmin.jsx";
import AdvertiserDashboard from "../pages/Advertiser/Dashboard/Dashboard";
import GenrePage from "../pages/Genre/GenrePage";
import GenresPage from "../pages/Genre/GenresPage";
import AdSlotTimeManagement from "../pages/Manager/AdSlot/AdSlotTimeManagement";
import BuyAdSlot from "../pages/Advertiser/BuyAdSlot/BuyAdSlot";
import WatchTogether from "../pages/WatchTogether/WatchTogether";

const isLoggedIn = () => {
  const loggedIn = localStorage.getItem("user");
  return loggedIn;
};

const role = localStorage.getItem("role") || "GUEST";

const routes = [
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

  {
    path: "/userRegister",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <UserRegister />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/userRegister/:id",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <UserRegisterDetail />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/userRegister/email/:email",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <UserRegisterEmail />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/admin/genres",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <GenreManagement />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/admin/persons",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <PersonManagement />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/admin/subscriptions",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <SubscriptionManagement />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/admin/subscription-orders",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <SubscriptionOrderManagement />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/admin/movieAdmin",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <MovieAdmin />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/admin/createMovie",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <CreateMovie />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/admin/movie/:id",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <MovieDetailAdmin />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/admin/contract",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <ContractAdmin />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/admin/contract/:id",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <ContractDetailAdmin />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  {
    path: "/admin/updateMovie/:id",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <UpdateMovieAdmin />
      </PrivateRoute>
    ),
    layout: "AdminLayout",
  },

  { path: "/user", element: <User />, layout: "AdminLayout" },

  { path: "/user/:id", element: <UserDetail />, layout: "AdminLayout" },

  //=================================================================================================
  //USER
  { path: "/movie/:movieId", element: <MoviePage />, layout: "UserLayout" },

  { path: "/watch/:movieId", element: <WatchPage />, layout: "UserLayout" },

  {
    path: "/watch-together/:movieId",
    element: <WatchTogether />,
    layout: "UserLayout",
  },

  { path: "/search", element: <SearchPage />, layout: "UserLayout" },

  { path: "/people", element: <PopularPeople />, layout: "UserLayout" },

  { path: "/person/:id", element: <PersonDetail />, layout: "UserLayout" },

  { path: "/genres", element: <GenresPage />, layout: "UserLayout" },
  { path: "/genre/:genreName", element: <GenrePage />, layout: "UserLayout" },

  { path: "/profile", element: <Profile />, layout: "UserLayout" },

  { path: "/profile/:id", element: <Profile />, layout: "UserLayout" },

  { path: "/news", element: <NewsPage />, layout: "UserLayout" },

  { path: "/news/:id", element: <NewsDetail />, layout: "UserLayout" },

  {
    path: "/subscription-plans",
    element: (
      <PrivateRoute>
        <SubscriptionPlans />
      </PrivateRoute>
    ),
    layout: "UserLayout",
  },

  {
    path: "/payment-success",
    element: <PaymentSuccess />,
    layout: "UserLayout",
  },

  {
    path: "/subscription-history",
    element: <SubscriptionHistory />,
    layout: "UserLayout",
  },

  //=================================================================================================

  { path: "/signup", element: <SignupPage /> },
  { path: "/homepage", element: <HomePage />, layout: "UserLayout" },
  { path: "/homescreen", element: <HomeScreen />, layout: "UserLayout" },
  { path: "/login", element: <LoginPage /> },
  { path: "/verify", element: <VerifyAccount /> },
  { path: "/registerPage", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/resetpassword", element: <ResetPassword /> },
  { path: "/signup-success", element: <SignupSuccess /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/api/Auth/ForgotPassword", element: <ResetPassword /> },
  { path: "/api/Auth/Verify", element: <VerifyAccount /> },

  //=================================================================================================
  //MANAGER
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
    path: "/manager/adslot-time",
    element: (
      <PrivateRoute requiredRole="MANAGER">
        <AdSlotTimeManagement />
      </PrivateRoute>
    ),
    layout: "ManagerLayout",
    private: true,
  },

  {
    path: "/manager/subscriptions",
    element: (
      <PrivateRoute requiredRole="MANAGER">
        <SubscriptionManagement />
      </PrivateRoute>
    ),
    layout: "ManagerLayout",
    private: true,
  },

  {
    path: "/manager/genres",
    element: (
      <PrivateRoute requiredRole="MANAGER">
        <GenreManagement />
      </PrivateRoute>
    ),
    layout: "ManagerLayout",
    private: true,
  },

  {
    path: "/manager/persons",
    element: (
      <PrivateRoute requiredRole="MANAGER">
        <PersonManagement />
      </PrivateRoute>
    ),
    layout: "ManagerLayout",
    private: true,
  },

  //=================================================================================================
  //PUBLISHER
  {
    path: "/publisher/movie",
    element: (
      <PrivateRoute requiredRole="PUBLISHER">
        <MoviePublisher />
      </PrivateRoute>
    ),
    layout: "PublisherLayout",
    private: true,
  },

  {
    path: "/publisher/dashboard",
    element: (
      <PrivateRoute requiredRole="PUBLISHER">
        <DashboardPublisher />
      </PrivateRoute>
    ),
    layout: "PublisherLayout",
    private: true,
  },

  {
    path: "/publisher/createMovie",
    element: (
      <PrivateRoute requiredRole="PUBLISHER">
        <CreateMoviePublisher />
      </PrivateRoute>
    ),
    layout: "PublisherLayout",
  },

  {
    path: "/publisher/movie/:id",
    element: (
      <PrivateRoute requiredRole="PUBLISHER">
        <MovieDetailPublisher />
      </PrivateRoute>
    ),
    layout: "PublisherLayout",
  },

  {
    path: "/publisher/contract",
    element: (
      <PrivateRoute requiredRole="PUBLISHER">
        <ContractPublisher />
      </PrivateRoute>
    ),
    layout: "PublisherLayout",
  },

  {
    path: "/publisher/contract/:id",
    element: (
      <PrivateRoute requiredRole="PUBLISHER">
        <ContractDetailPublisher />
      </PrivateRoute>
    ),
    layout: "PublisherLayout",
  },

  {
    path: "/publisher/upload",
    element: (
      <PrivateRoute requiredRole="PUBLISHER">
        <UploadFormPublisher />
      </PrivateRoute>
    ),
    layout: "PublisherLayout",
  },
  {
    path: "/publisher/upload/:id",
    element: (
      <PrivateRoute requiredRole="PUBLISHER">
        <UploadFormPublisher />
      </PrivateRoute>
    ),
    layout: "PublisherLayout",
  },

  {
    path: "/publisher/updateMovie/:id",
    element: (
      <PrivateRoute requiredRole="PUBLISHER">
        <UpdateMoviePublisher />
      </PrivateRoute>
    ),
    layout: "PublisherLayout",
  },

  {
    path: "/advertiser/dashboard",
    element: (
      <PrivateRoute requiredRole="ADVERTISER">
        <AdvertiserDashboard />
      </PrivateRoute>
    ),
    layout: "AdvertiserLayout",
  },

  {
    path: "/advertiser/buy-adslot",
    element: (
      <PrivateRoute requiredRole="ADVERTISER">
        <BuyAdSlot />
      </PrivateRoute>
    ),
    layout: "UserLayout",
    private: true,
  },

  { path: "*", element: <h1>404 - Page Not Found</h1> },

  {
    path: "/process-status",
    element: (
      <PrivateRoute>
        <ProcessStatus />
      </PrivateRoute>
    ),
    layout: "DefaultLayout",
  },
];

export default routes;
