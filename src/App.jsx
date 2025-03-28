import React from "react";
import { RouterProvider } from "react-router-dom";
import createRouter from "./routers/createRouter";

/**
 * Main App component that renders the router
 *
 * Navbar handling has been simplified with a "blacklist" approach:
 * - PersistentLayout hiển thị navbar mặc định cho tất cả trang
 * - Chỉ ẩn navbar khi trang đó là dashboard riêng của role (admin, manager, v.v.)
 * - Trang đăng nhập/đăng ký cũng không hiển thị navbar
 * - Trang xem phim có xử lý đặc biệt cho layout
 *
 * Cách tiếp cận này gọn gàng hơn, dễ bảo trì hơn và tránh được việc liệt kê
 * tất cả các trang cần hiển thị navbar.
 */
const App = () => {
  return <RouterProvider router={createRouter()} />;
};

export default App;
