import { createBrowserRouter } from "react-router-dom";
import routes from "./routes";
import AdminLayout from "../Layout/AdminLayout";
import UserLayout from "../Layout/UserLayout";
import PrivateRoute from "./PrivateRoute";
import AdvertiserLayout from "../Layout/AdvertiserLayout";
import ScrollToTop from "../components/Header/ScrollToTop";
import VerifyEmail from "../pages/Auth/VerifyEmail";

const renderWithLayout = (route) => {
  let Layout;

  if (route.layout === "AdminLayout") {
    Layout = AdminLayout;
  } else if (route.layout === "UserLayout") {
    Layout = UserLayout;
  } else if (route.layout === "AdvertiserLayout") {
    Layout = AdvertiserLayout;
  }

  const content = route.private ? (
    <PrivateRoute roles={route.roles} user={route.user}>
      {route.element}
    </PrivateRoute>
  ) : (
    route.element
  );

  return Layout ? (
    <ScrollToTop>
      <Layout>{content}</Layout>
    </ScrollToTop>
  ) : (
    content
  );
};

const createRouter = () =>
  createBrowserRouter(
    routes.map((route) => ({
      path: route.path,
      element: renderWithLayout(route),
    }))
  );

export default createRouter;
