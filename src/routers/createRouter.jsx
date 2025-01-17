import { createBrowserRouter } from "react-router-dom";
import routes from "./routes";
import AdminLayout from "../Layout/AdminLayout";
import UserLayout from "../Layout/UserLayout";
import PrivateRoute from "./PrivateRoute";
import AdvertiserLayout from "../Layout/AdvertiserLayout";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Add ScrollToTop component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

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
    <Layout>
      <ScrollToTop />
      {content}
    </Layout>
  ) : (
    <>
      <ScrollToTop />
      {content}
    </>
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
