import React from "react";
import Slider from "../components/Homepage/Slider"; // Kiểm tra đường dẫn import

const HomeScreen = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Slider */}
      <Slider />

      {/* Các section khác */}
      <div className="container mx-auto px-4 py-12">
        {/* Content sections */}
      </div>
    </div>
  );
};

export default HomeScreen;
