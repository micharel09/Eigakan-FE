import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Header/Navbar";
import Footer from "../components/Footer/Footer";
import Loading from "../components/Loading/Loading";

const UserLayout = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Giả lập loading khi chuyển trang
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Thời gian loading ngắn để UX tốt hơn

    return () => clearTimeout(timer);
  }, [location.pathname]); // Chạy lại khi đường dẫn thay đổi

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default UserLayout;
