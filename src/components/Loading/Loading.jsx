import React from "react";
import { Spin } from "antd";

const Loading = ({ isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <Spin size="large" style={{ color: "#FF009F" }} />
    </div>
  );
};

export default Loading;
