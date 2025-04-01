import React from "react";
import { Spin } from "antd";

const Loading = ({ isVisible = true, className = "" }) => {
  if (!isVisible) return null;

  return (
    <div
      className={`flex justify-center items-center h-screen bg-black ${className}`}
    >
      <Spin size="large" className="[&_.ant-spin-dot-item]:bg-[#FF009F]" />
    </div>
  );
};

export default Loading;
