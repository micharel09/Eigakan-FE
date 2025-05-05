import { createBrowserRouter } from "react-router-dom";
import routes from "./routes";
import AdminLayout from "../Layout/AdminLayout";
import UserLayout from "../Layout/UserLayout";
import PrivateRoute from "./PrivateRoute";
import AdvertiserLayout from "../Layout/AdvertiserLayout";
import ManagerLayout from "../Layout/ManagerLayout";
import PublisherLayout from "../Layout/PublisherLayout";
import PersistentLayout from "../Layout/PersistentLayout";

const renderWithLayout = (route) => {
  let Layout;

  if (route.layout === "AdminLayout") {
    Layout = AdminLayout;
  } else if (route.layout === "UserLayout") {
    Layout = UserLayout;
  } else if (route.layout === "AdvertiserLayout") {
    Layout = AdvertiserLayout;
  } else if (route.layout === "ManagerLayout") {
    Layout = ManagerLayout;
  } else if (route.layout === "PublisherLayout") {
    Layout = PublisherLayout;
  }

  const content = route.private ? (
    <PrivateRoute roles={route.roles} user={route.user}>
      {route.element}
    </PrivateRoute>
  ) : (
    route.element
  );

  return Layout ? <Layout>{content}</Layout> : content;
};

/**
 * Creates a router with persistent layouts
 * When using an admin-type layout (admin, manager, publisher, advertiser),
 * the PersistentLayout will detect this and not show duplicate navbar
 */
const createRouter = () => {
  // Create a router configuration that includes both the persistent layout and route-specific layouts
  return createBrowserRouter([
    {
      path: "/",
      element: <PersistentLayout />,
      children: routes.map((route) => ({
        path: route.path === "/" ? "" : route.path,
        element: renderWithLayout(route),
      })),
    },
  ]);
};

export default createRouter;
