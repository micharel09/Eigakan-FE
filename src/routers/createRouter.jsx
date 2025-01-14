import { createBrowserRouter } from 'react-router-dom';
import routes from './routes';
import AdminLayout from '../Layout/AdminLayout';
import UserLayout from '../Layout/UserLayout';
import PrivateRoute from './PrivateRoute';
import AdvertiserLayout from '../Layout/AdvertiserLayout';

const renderWithLayout = (route) => {
  let Layout;

  // Kiểm tra giá trị của route.layout để xác định layout cần sử dụng
  if (route.layout === 'AdminLayout') {
    Layout = AdminLayout;
  } else if (route.layout === 'UserLayout') {
    Layout = UserLayout;
  } else if (route.layout === 'AdvertiserLayout') {
    Layout = AdvertiserLayout;
  } 

  const content = route.private ? (
    <PrivateRoute roles={route.roles} user={route.user}>{route.element}</PrivateRoute>
  ) : (
    route.element
  );

  return Layout ? <Layout>{content}</Layout> : content;
};


// Tạo router
const createRouter = () =>
  createBrowserRouter(
    routes.map((route) => ({
      path: route.path,
      element: renderWithLayout(route),
    }))
  );

export default createRouter;
